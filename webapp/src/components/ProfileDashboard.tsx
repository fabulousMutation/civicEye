"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Loader2, Camera, Calendar, ChevronRight, MapPin } from "lucide-react";
import Image from "next/image";

type Profile = { id: string; full_name: string; avatar_url: string | null; role: string; };
type Report = { id: string; tracking_id: string; issue_type: string; status: string; geotag_timestamp: string; created_at: string; image_url?: string; };

export default function ProfileDashboard({ profile, reports }: { profile: Profile; reports: Report[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    if (error) setMsg({ type: "error", text: error.message });
    else {
        setMsg({ type: "success", text: "Profile updated" });
        router.refresh();
    }
    setLoading(false);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const filePath = `${profile.id}-${Math.random()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
      router.refresh();
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{profile.role}</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">
          Log Out
        </button>
      </header>

      {/* Profile Form */}
      <section className="space-y-8">
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border border-border group">
                {avatarUrl ? <Image src={avatarUrl} alt="Avatar" fill className="object-cover" /> : <User className="w-10 h-10 text-muted-foreground m-auto absolute inset-0" />}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
                </label>
            </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
            <div className="bg-secondary rounded-[2rem] p-2">
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-transparent border-none focus:ring-0 px-6 py-4 font-bold text-lg"
                />
            </div>
            {msg.text && (
                <div className={`p-3 rounded-2xl text-xs font-bold text-center ${msg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {msg.text}
                </div>
            )}
            <button disabled={loading} type="submit" className="primary-action w-full h-14">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Settings"}
            </button>
        </form>
      </section>

      {/* History */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</h2>
            <span className="text-[10px] font-bold text-muted-foreground">{reports.length} Reports</span>
        </div>

        <div className="space-y-3">
            {reports.map((report) => (
                <button 
                    key={report.id}
                    onClick={() => router.push(`/track/${report.tracking_id}`)}
                    className="w-full group flex items-center gap-4 p-5 bg-secondary border border-border rounded-3xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
                >
                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-foreground truncate">{report.issue_type}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${report.status === 'resolved' ? 'bg-emerald-500' : 'bg-primary'}`} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(report.geotag_timestamp || report.created_at).toLocaleDateString()}</span>
                            <span className="font-mono text-[9px] opacity-50">{report.tracking_id}</span>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </button>
            ))}
            {reports.length === 0 && (
                <div className="py-12 text-center text-muted-foreground font-bold text-sm uppercase tracking-widest opacity-30">
                    No history found
                </div>
            )}
        </div>
      </section>
    </div>
  );
}

