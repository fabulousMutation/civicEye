"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User, Loader2, Camera, Calendar, ChevronRight, MapPin,
  Pencil, X, Phone, Mail, LogOut, Trophy, TrendingUp,
  CheckCircle2, Clock, BarChart3, Eye, EyeOff, Bell, Shield, UserX
} from "lucide-react";
import Image from "next/image";
import { calculateImpactScore, getImpactLevel } from "@/lib/impactScore";

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  phone?: string | null;
  anonymous_mode?: boolean;
  notification_prefs?: { email: boolean; push: boolean };
  location?: string | null;
};
type Report = {
  id: string; tracking_id: string; issue_type: string; status: string;
  priority?: string; rejection_title?: string; geotag_timestamp: string;
  created_at: string; image_url?: string;
};

function ImpactScore({ reports }: { reports: Report[] }) {
  const score = calculateImpactScore(reports);
  const level = getImpactLevel(score);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card p-6 flex items-center gap-6">
      {/* Circular progress ring */}
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgb(var(--border))" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke="rgb(var(--primary))" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black">{score}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-warning" />
          <span className="font-black text-sm uppercase tracking-widest text-muted-foreground">Impact Score</span>
        </div>
        <div className={`text-xl font-black ${level.color}`}>{level.badge} {level.label}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {reports.filter(r => r.status !== 'REJECTED').length} valid report{reports.filter(r => r.status !== 'REJECTED').length !== 1 ? 's' : ''} · {reports.filter(r => r.status === 'AUTHORITY_NOTIFIED').length} resolved
        </p>
      </div>
    </div>
  );
}

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
  const [showPhone, setShowPhone] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  // Preferences
  const [anonymousMode, setAnonymousMode] = useState(profile.anonymous_mode ?? false);
  const [notifEmail, setNotifEmail] = useState(profile.notification_prefs?.email ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [origName, setOrigName] = useState(profile.full_name || "");
  const [origPhone, setOrigPhone] = useState(profile.phone || "");

  // Computed stats
  const totalReports = reports.length;
  const resolved = reports.filter(r => r.status === 'AUTHORITY_NOTIFIED').length;
  const pending = reports.filter(r => r.status === 'PENDING_REVIEW').length;
  const rejected = reports.filter(r => r.status === 'REJECTED').length;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      phone,
      anonymous_mode: anonymousMode,
      notification_prefs: { email: notifEmail, push: false },
    }).eq("id", profile.id);
    if (error) setMsg({ type: "error", text: error.message });
    else {
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setOrigName(fullName);
      setOrigPhone(phone);
      setEditMode(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handlePrefToggle = async (pref: 'anonymous' | 'notifEmail', val: boolean) => {
    setSavingPrefs(true);
    if (pref === 'anonymous') setAnonymousMode(val);
    else setNotifEmail(val);
    await supabase.from("profiles").update({
      anonymous_mode: pref === 'anonymous' ? val : anonymousMode,
      notification_prefs: { email: pref === 'notifEmail' ? val : notifEmail, push: false },
    }).eq("id", profile.id);
    setSavingPrefs(false);
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
      case 'high': case 'critical': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-10 space-y-10">

      {/* ===== HEADER ===== */}
      <header className="flex justify-between items-center animate-fade-in-up">
        <div className="space-y-1">
          <p className="section-label">Your Account</p>
          <h1 className="text-3xl font-black tracking-tight">Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
            {profile.role}
          </span>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-9 h-9 flex items-center justify-center bg-danger/10 text-danger rounded-xl hover:bg-danger/20 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===== LOGOUT MODAL ===== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-background border border-border rounded-3xl shadow-2xl p-8 max-w-sm w-full space-y-6 animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
                <LogOut className="w-7 h-7 text-danger" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Sign Out?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You&apos;ll need to sign in again to access your reports and profile.
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
                className="flex-1 h-12 bg-danger text-white rounded-2xl font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AVATAR + IDENTITY ===== */}
      <section className="animate-fade-in-up delay-100" style={{ opacity: 0 }}>
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border-2 border-border group">
            {avatarUrl
              ? <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              : <User className="w-10 h-10 text-muted-foreground absolute inset-0 m-auto" />
            }
            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground font-medium">Tap to change photo</p>
        </div>

        {/* View / Edit Mode */}
        {!editMode ? (
          <div className="glass-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-4 flex-1 min-w-0">
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
                  <span className="text-sm text-muted-foreground truncate">
                    {phone
                      ? showPhone ? phone : `${phone.slice(0, 3)}••••${phone.slice(-2)}`
                      : "No phone set"}
                  </span>
                  {phone && (
                    <button
                      onClick={() => setShowPhone(!showPhone)}
                      className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPhone ? "Hide phone" : "Show phone"}
                    >
                      {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors shrink-0"
                aria-label="Edit profile"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="glass-card p-6 border-primary/30 space-y-4">
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
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl pl-12 pr-6 py-4 font-bold text-base transition-all outline-none"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl pl-12 pr-6 py-4 font-bold text-base transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{email}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-auto">Read-only</span>
              </div>
            </div>
            {msg.text && (
              <div className={`p-3 rounded-2xl text-xs font-bold text-center ${msg.type === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                {msg.text}
              </div>
            )}
            <button disabled={loading} type="submit" className="primary-action w-full h-14">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
            </button>
          </form>
        )}
      </section>

      {/* ===== IMPACT SCORE ===== */}
      <section className="animate-fade-in-up delay-200" style={{ opacity: 0 }}>
        <ImpactScore reports={reports} />
      </section>

      {/* ===== STATS GRID ===== */}
      <section className="animate-fade-in-up delay-300" style={{ opacity: 0 }}>
        <p className="section-label mb-4">Activity Overview</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BarChart3, label: "Total Reports", value: totalReports, color: "text-foreground", bg: "bg-secondary" },
            { icon: CheckCircle2, label: "Resolved", value: resolved, color: "text-success", bg: "bg-success/10" },
            { icon: Clock, label: "Pending", value: pending, color: "text-warning", bg: "bg-warning/10" },
            { icon: TrendingUp, label: "Rejected", value: rejected, color: "text-danger", bg: "bg-danger/10" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PREFERENCES / SETTINGS ===== */}
      <section className="space-y-4 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
        <p className="section-label">Privacy &amp; Notifications</p>
        <div className="glass-card divide-y divide-border">
          {/* Anonymous mode */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-sm">Anonymous Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your name won&apos;t appear on public reports</p>
              </div>
            </div>
            <button
              onClick={() => handlePrefToggle('anonymous', !anonymousMode)}
              disabled={savingPrefs}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                anonymousMode ? 'bg-accent' : 'bg-border'
              } disabled:opacity-50`}
              aria-label="Toggle anonymous mode"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                anonymousMode ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Email notifications */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get updates on your report status</p>
              </div>
            </div>
            <button
              onClick={() => handlePrefToggle('notifEmail', !notifEmail)}
              disabled={savingPrefs}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                notifEmail ? 'bg-primary' : 'bg-border'
              } disabled:opacity-50`}
              aria-label="Toggle email notifications"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                notifEmail ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Role / verification badge */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-bold text-sm">Account Role</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your current permission level</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
              {profile.role}
            </span>
          </div>
        </div>
      </section>

      {/* ===== REPORT HISTORY ===== */}
      <section className="space-y-4 animate-fade-in-up delay-500" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="section-label">Recent Activity</h2>
          <span className="text-[10px] font-bold text-muted-foreground">{reports.length} Reports</span>
        </div>

        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-7 h-7 text-primary/30" />
              </div>
              <p className="font-bold text-sm text-muted-foreground">No issues reported yet. Be the first 👀</p>
            </div>
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => router.push(`/track/${report.tracking_id}`)}
                className="group w-full flex items-center gap-4 p-5 bg-secondary border border-border rounded-3xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
              >
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shrink-0 border border-border">
                  <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-extrabold text-foreground truncate">
                      {report.status === 'REJECTED' ? (report.rejection_title || 'Rejected Report') : report.issue_type}
                    </span>
                    {report.priority && report.priority !== 'NONE' && (
                      <span className={`badge ${priorityColor(report.priority)}`}>{report.priority}</span>
                    )}
                    <div className={`status-dot ${
                      report.status === 'AUTHORITY_NOTIFIED' ? 'status-dot-resolved' :
                      report.status === 'REJECTED' ? 'status-dot-rejected' : 'status-dot-pending'
                    }`} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.geotag_timestamp || report.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-[9px] opacity-50">{report.tracking_id}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
