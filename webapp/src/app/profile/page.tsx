import { createClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabaseClient";
import { redirect } from "next/navigation";
import ProfileDashboard from "@/components/ProfileDashboard";

export const revalidate = 0;


export const metadata = {
  title: "Profile | CivicEye",
};

export default async function ProfilePage() {
  const supabaseServer = createClient();

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch their reports using public client (bypasses RLS)
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <ProfileDashboard profile={profile || { id: user.id, full_name: user?.user_metadata?.full_name || "User", role: "citizen", avatar_url: null, phone: null }} reports={reports || []} email={user.email || ""} />
    </div>
  );
}
