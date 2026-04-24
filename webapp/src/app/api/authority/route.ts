import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const { reportId, lat, lng, issueType } = await req.json();

        // 1. Reverse Geocode via OpenStreetMap Nominatim
        const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const geocodeData = await geocodeRes.json();
        const city = geocodeData?.address?.city || geocodeData?.address?.town || geocodeData?.address?.village || 'Local';
        const state = geocodeData?.address?.state || '';
        const zip = geocodeData?.address?.postcode || '';

        // 2. Search API Integration (Tavily)
        const searchQuery = `${city} ${state} ${zip} report ${issueType} department official contact email phone number`;
        
        let authorityContact = {
            email: 'contact@localgov.org', // Default fallback
            phone: '555-0192',
            department: `${city} ${issueType} Management Dept`
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
                const phones = textDump.match(/(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/gi);

                if (emails && emails.length > 0) authorityContact.email = emails[0];
                if (phones && phones.length > 0) authorityContact.phone = phones[0];
            } else {
                console.warn("Tavily API responded with an error, using fallback authority contact.");
            }
        }

        // 3. Update Supabase Reference Object
        const { error } = await supabase
            .from('reports')
            .update({ 
                authority_contact_info: authorityContact,
                status: 'Authority Esculated'
            })
            .eq('tracking_id', reportId);

        if (error) throw error;

        return NextResponse.json({ success: true, contact: authorityContact, geocode: { city, state } });

    } catch (error: any) {
        console.error("Authority Scraper Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
