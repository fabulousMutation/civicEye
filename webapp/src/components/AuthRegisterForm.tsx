"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, Shield } from "lucide-react";

export default function AuthRegisterForm() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-8 text-center animate-scale-in">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto border-2 border-success/20">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight">Check Your Email</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a verification link to <strong className="text-foreground">{email}</strong>.
            Click the link to activate your account.
          </p>
        </div>
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder, or{" "}
          <button onClick={() => setSuccess(false)} className="text-primary font-bold hover:underline">
            try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">Join CivicEye</h1>
        <p className="text-muted-foreground text-sm font-medium">Create your citizen account</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-xs font-bold flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠️</span>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="relative">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
            className="input-field pl-14"
            placeholder="Full Name"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field pl-14"
            placeholder="you@example.com"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input-field pl-14 pr-14"
            placeholder="Min. 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <button
          type="submit"
          id="submit-register"
          disabled={loading}
          className="primary-action w-full h-14 text-base font-bold"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="pt-6 border-t border-border">
        <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-widest">
          Already a citizen?{" "}
          <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1">
            Sign In <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
