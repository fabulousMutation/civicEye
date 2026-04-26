import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@/lib/supabase/server';

/**
 * Automatically generates a secure tracing ID using format: CR-YYYY-XXXXXX
 */
function generateTracingId(): string {
  const year = new Date().getFullYear();
  // Generates a random 6-digit number between 100000 and 999999
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `CR-${year}-${randomStr}`;
}

/**
 * Reverse geocode coordinates to a human-readable address.
 * Uses Google Maps Geocoding API if key is set, else falls back to Nominatim.
 */
async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string; state: string; zip: string }> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  // Try Google Maps Geocoding API first
  if (googleKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const result = data.results[0];
        const components = result.address_components || [];
        const getComponent = (type: string) => components.find((c: { types: string[] })=> c.types.includes(type))?.long_name || '';
        return {
          address: result.formatted_address || `${lat}, ${lng}`,
          city: getComponent('locality') || getComponent('administrative_area_level_2') || 'Local',
          state: getComponent('administrative_area_level_1') || '',
          zip: getComponent('postal_code') || '',
        };
      }
    } catch (err) {
      console.warn('Google Maps geocoding failed, falling back to Nominatim:', err);
    }
  }

  // Fallback: OpenStreetMap Nominatim (free, no key)
  try {
    const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'User-Agent': 'CivicEye/1.0' }
    });
    const geocodeData = await geocodeRes.json();
    const city = geocodeData?.address?.city || geocodeData?.address?.town || geocodeData?.address?.village || 'Local';
    const state = geocodeData?.address?.state || '';
    const zip = geocodeData?.address?.postcode || '';
    const address = geocodeData?.display_name || `${lat}, ${lng}`;
    return { address, city, state, zip };
  } catch (err) {
    console.error('Nominatim geocoding failed:', err);
    return { address: `${lat}, ${lng}`, city: 'Local', state: '', zip: '' };
  }
}

export async function POST(req: Request) {
  try {
    // 1. Parse incoming payload
    const body = await req.json();
    const { imageUrl, location, timestamp } = body;

    if (!imageUrl || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required payload: imageUrl and location.' },
        { status: 400 }
      );
    }

    // 2. Safely retrieve the OpenRouter API Key (Server-side only)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error('OPENROUTER_API_KEY is not configured in the environment.');
      return NextResponse.json(
        { success: false, error: 'Internal server configuration error.' },
        { status: 500 }
      );
    }

    // 3. Strict Vision Prompting Payload with Enhanced Severity Algorithm
    const systemPrompt = `You are a strict JSON-only AI Vision assistant for a Citizen Reporting PWA with a Gatekeeper mechanism.

STEP 1: GATEKEEPER
Analyze the image to determine if it depicts a physical, real-world civic, environmental, or infrastructure issue. 
You MUST explicitly look for and REJECT the following invalid submissions:
- Digital screenshots (e.g., screenshots of games, apps, text, or websites)
- Selfies or portraits
- Indoor household messes or private property interiors
- Memes, cartoons, or AI-generated art not depicting reality
- Completely black, blank, or indiscernible images

STEP 2: CLASSIFICATION & SEVERITY ALGORITHM
If the image passes the Gatekeeper (is a valid civic issue), classify the issue AND assign a priority using these strict definitions:

PRIORITY DEFINITIONS:
- **High**: Life-threatening or major safety hazards. Examples: car accidents, structural collapse, exposed electrical wiring, fire damage, flooding blocking roads, fallen trees on roads, open manholes, violent incidents.
- **Medium**: Significant infrastructure or public health issues that need attention but are not immediately dangerous. Examples: large potholes, broken traffic lights, damaged sidewalks, overflowing bins causing health hazard, broken streetlights in busy areas, water leaks.
- **Low**: Aesthetic, cosmetic, or non-urgent issues. Examples: graffiti, minor litter, faded road markings, peeling paint on public benches, overgrown vegetation not blocking paths, cracked (non-hazardous) signage.

If the image fails the Gatekeeper, reject it and provide a clear rejection reason.

You MUST output ONLY a raw JSON object. DO NOT wrap the JSON in Markdown formatting (no \`\`\`json blocks).
Your output must EXACTLY match the following structure:
{
  "is_valid_civic_issue": boolean (true if valid, false if rejected),
  "rejection_title": "string (null if valid. If rejected, provide a SHORT title for the rejection reason, e.g., 'Not a Civic Issue', 'Digital Screenshot Detected', 'Selfie / Portrait', 'Insufficient Visual Evidence', 'Duplicate or Irrelevant Content')",
  "rejection_reason": "string (null if valid. If rejected, clearly state the full explanation why, e.g., 'This appears to be a screenshot of a digital game, not a physical civic issue.')",
  "issue_type": "string (e.g., Pothole, Garbage, Violence, Vandalism, etc. Use null if rejected)",
  "priority": "string (must be one of: Low, Medium, High. Use 'NONE' if rejected)",
  "tags": ["string", "string", "string"], // 3-5 descriptive keyword strings. Empty array if rejected
  "text_summary": "string (A professional, concise description suitable for an official report to authorities. Use null if rejected)"
}`;

    // 4. OpenRouter Integration
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/auto', // Will default to a fast model handling vision if mapped via OpenRouter auto
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      console.error(`OpenRouter failed: ${aiResponse.status} ${await aiResponse.text()}`);
      throw new Error('AI Vision orchestration service unavailable');
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || '';

    // 5. Sanitize and parse the AI JSON response
    rawContent = rawContent.trim();
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let classification;
    try {
      classification = JSON.parse(rawContent);
    } catch {
      console.error('JSON parsing failed for AI response:', rawContent);
      throw new Error('AI Vision returned an invalid JSON classification.');
    }

    // 6. Generate secure tracing identifier
    const tracingId = generateTracingId();

    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // 7. Reverse geocode to get human-readable address
    const isRejected = classification.is_valid_civic_issue === false;

    let authorityContact = null;
    let resolvedAddress = '';

    if (!isRejected && location?.lat && location?.lng) {
      // Reverse geocode
      const geo = await reverseGeocode(location.lat, location.lng);
      resolvedAddress = geo.address;

      // Search API Integration (Tavily) for authority contact
      const issueType = classification.issue_type || 'Civic Issue';
      const searchQuery = `${geo.city} ${geo.state} ${geo.zip} report ${issueType} department official contact email phone number`;
      
      authorityContact = {
          email: 'contact@localgov.org', // Default fallback
          phone: '555-0192',
          department: `${geo.city} ${issueType} Management Dept`
      };

      if (process.env.SEARCH_API_KEY) {
          const searchResponse = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  api_key: process.env.SEARCH_API_KEY, 
                  query: searchQuery, 
                  search_depth: 'advanced' 
              })
          });

          if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              
              // Aggressive RegEx parsing against all search results to scrape emails and phone numbers.
              const textDump = JSON.stringify(searchData.results);
              const emails = textDump.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/gi);
              const phones = textDump.match(/(\+\d{1,2}\s?)?1?\-?\.\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/gi);

              if (emails && emails.length > 0) authorityContact.email = emails[0];
              if (phones && phones.length > 0) authorityContact.phone = phones[0];
          } else {
              console.warn("Tavily API responded with an error, using fallback authority contact.");
          }
      }
    }

    // 8. Generate a standardized name for rejected assets (for auditing/reporting)
    const rejectedAssetName = isRejected
      ? `REJECTED_ASSET_${tracingId}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`
      : null;

    // 9. Database Interaction (Insert into Supabase)
    const { data: dbData, error: dbError } = await supabase
      .from('reports')
      .insert([
        {
          tracking_id: tracingId,
          image_url: imageUrl,
          location_lat: location.lat,
          location_lng: location.lng,
          address: resolvedAddress || null,
          geotag_timestamp: timestamp || new Date().toISOString(),
          issue_type: isRejected ? rejectedAssetName : classification.issue_type,
          priority: isRejected ? 'NONE' : classification.priority,
          tags: isRejected ? [] : classification.tags,
          text_summary: isRejected ? classification.rejection_reason : classification.text_summary,
          status: isRejected ? 'REJECTED' : 'PENDING_REVIEW',
          rejection_reason: classification.rejection_reason || null,
          rejection_title: classification.rejection_title || null,
          user_id: user ? user.id : null, // Tie to authenticated user if they exist
          authority_contact_info: authorityContact
        }
      ])
      // Return the inserted row
      .select()
      .single();

    if (dbError) {
      console.error('Supabase DB Insert Error:', dbError);
      throw new Error('Failed to inject classification into the database.');
    }

    // Return successful outcome to frontend
    return NextResponse.json({
      success: true,
      tracing_id: tracingId,
      classification,
      is_rejected: isRejected,
      report: dbData
    }, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected internal error occurred.';
    console.error('Classify Route Exception:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
