import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { reportId, text_summary, additional_images = [] } = await req.json();

        // 1. Fetch original report to get authority details and images
        const { data: report, error: fetchError } = await supabase
            .from('reports')
            .select('image_url, issue_type, authority_contact_info')
            .eq('tracking_id', reportId)
            .single();

        if (fetchError || !report) throw new Error('Report not found');

        const authorityContact = report.authority_contact_info || {
            email: 'contact@localgov.org', // Default fallback
            department: 'Local City Management Dept'
        };
        const issueType = report.issue_type || 'Civic Issue';

        // 2. Send email via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                const destinationEmails = authorityContact.email ? [authorityContact.email] : [];
                
                let extraImagesHtml = '';
                if (additional_images.length > 0) {
                    extraImagesHtml = `<br/><div style="margin-top: 15px;"><h3>Additional Evidence:</h3><div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
                    additional_images.forEach((img: string) => {
                        extraImagesHtml += `<img src="${img}" alt="Extra Evidence" style="width: 200px; max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); object-fit: cover;" />`;
                    });
                    extraImagesHtml += `</div></div>`;
                }
                
                if (destinationEmails.length > 0) {
                    await resend.emails.send({
                        from: 'CivicEye <onboarding@resend.dev>',
                        to: destinationEmails,
                        subject: `Urgent Civic Report: ${issueType} reported requires attention`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px;">
                                <h2 style="color: #2563eb;">New Civic Issue Reported: ${issueType}</h2>
                                <p><strong>Tracking ID:</strong> ${reportId}</p>
                                <p><strong>Summary:</strong> ${text_summary || "No description provided."}</p>
                                <br/>
                                <div style="margin-top: 20px;">
                                    <h3>Initial Evidence:</h3>
                                    ${report.image_url ? `<img src="${report.image_url}" alt="Incident Evidence" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"/>` : '<p>No initial image provided.</p>'}
                                </div>
                                ${extraImagesHtml}
                            </div>
                        `
                    });
                }
            } catch (err) {
                console.error("Resend delivery failed:", err);
            }
        }

        // 3. Update Supabase Reference Object
        const { error: updateError } = await supabase
            .from('reports')
            .update({ 
                status: 'AUTHORITY_NOTIFIED',
                text_summary,
                additional_images
            })
            .eq('tracking_id', reportId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, contact: authorityContact });

    } catch (error: unknown) {
        console.error("Authority Scraper Route Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
