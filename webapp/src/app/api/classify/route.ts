import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Automatically generates a secure tracing ID using format: CR-YYYY-XXXXXX
 */
function generateTracingId(): string {
  const year = new Date().getFullYear();
  // Generates a random 6-digit number between 100000 and 999999
  const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
  return `CR-${year}-${randomStr}`;
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

    // 3. Strict Vision Prompting Payload
    const systemPrompt = `You are a strict JSON-only AI Vision assistant for a Citizen Reporting PWA.
Examine the provided image and classify the civic issue.
You MUST output ONLY a raw JSON object. DO NOT wrap the JSON in Markdown formatting (no \`\`\`json blocks).
Your output must EXACTLY match the following structure:
{
  "issue_type": "string (e.g., Pothole, Garbage, Violence, Vandalism, etc.)",
  "priority": "string (must be one of: Low, Medium, High, Critical)",
  "tags": ["string", "string", "string"], // 3-5 descriptive keyword strings
  "text_summary": "string (A professional, concise description built from the image)"
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
    } catch (parseError) {
      console.error('JSON parsing failed for AI response:', rawContent);
      throw new Error('AI Vision returned an invalid JSON classification.');
    }

    // 6. Generate secure tracing identifier
    const tracingId = generateTracingId();

    // 7. Database Interaction (Insert into Supabase)
    const { data: dbData, error: dbError } = await supabase
      .from('reports')
      .insert([
        {
          tracking_id: tracingId,
          image_url: imageUrl,
          location_lat: location.lat,
          location_lng: location.lng,
          geotag_timestamp: timestamp || new Date().toISOString(),
          issue_type: classification.issue_type,
          priority: classification.priority,
          tags: classification.tags,
          text_summary: classification.text_summary,
          status: 'pending' // Providing a default status
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
      report: dbData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Classify Route Exception:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected internal error occurred.' },
      { status: 500 }
    );
  }
}
