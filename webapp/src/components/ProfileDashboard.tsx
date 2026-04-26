"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Loader2, Camera, Calendar, ChevronRight, MapPin, Pencil, X, Phone, Mail, LogOut } from "lucide-react";
import Image from "next/image";

type Profile = { id: string; full_name: string; avatar_url: string | null; role: string; phone?: string | null; };
type Report = { id: string; tracking_id: string; issue_type: string; status: string; priority?: string; rejection_title?: string; geotag_timestamp: string; created_at: string; image_url?: string; };

export default function ProfileDashboard({ profile, reports, email }: { profile: Profile; reports: Report[]; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Stash originals for cancel
  const [origName, setOrigName] = useState(profile.full_name || "");
  const [origPhone, setOrigPhone] = useState(profile.phone || "");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", profile.id);
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({ type: "success", text: "Profile updated" });
      setOrigName(fullName);
      setOrigPhone(phone);
      setEditMode(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFullName(origName);
    setPhone(origPhone);
    setEditMode(false);
    setMsg({ type: "", text: "" });
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

  const priorityColor = (p?: string) => {
    switch (p?.toLowerCase()) {
      case 'high': case 'critical': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-primary';
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

        {/* <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">
          Log Out
        </button> */}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-background border border-border rounded-3xl shadow-2xl p-8 max-w-sm w-full space-y-6 animate-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Sign Out?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You&apos;ll need to sign in again to access your reports and profile. Are you sure?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 h-12 bg-secondary border border-border rounded-2xl font-bold text-sm hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setLoggingOut(true);
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                disabled={loggingOut}
                className="flex-1 h-12 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Section */}
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

        {/* View / Edit Mode */}
        {!editMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-secondary rounded-3xl border border-border">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-bold text-lg text-foreground truncate">{fullName || "No name set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{phone || "No phone set"}</span>
                </div>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors shrink-0 ml-4"
                aria-label="Edit profile"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="bg-secondary rounded-3xl p-6 border border-primary/30 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Edit Mode</span>
                <button type="button" onClick={handleCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl pl-12 pr-6 py-4 font-bold text-base transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl pl-12 pr-6 py-4 font-bold text-base transition-all"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{email}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-auto">Read-only</span>
              </div>
            </div>
            {msg.text && (
              <div className={`p-3 rounded-2xl text-xs font-bold text-center ${msg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {msg.text}
              </div>
            )}
            <button disabled={loading} type="submit" className="primary-action w-full h-14">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
            </button>
          </form>
        )}
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
                  <span className="font-extrabold text-foreground truncate">
                    {report.status === 'REJECTED' ? (report.rejection_title || 'Rejected Report') : report.issue_type}
                  </span>
                  {report.priority && report.priority !== 'NONE' && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${priorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${report.status === 'resolved' || report.status === 'AUTHORITY_NOTIFIED' ? 'bg-emerald-500' : report.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary'}`} />
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
