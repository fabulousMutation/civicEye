"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function AuthLoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setErrorMsg("Enter your email first to receive a magic link.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMsg("Magic link sent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-black tracking-tighter">Welcome Back</h1>
        <p className="text-muted-foreground text-sm font-medium">Sign into your CivicEye account</p>
      </div>
      
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}
      
      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold text-center">
          {msg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-14 pr-6 h-14 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-muted-foreground/40 transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-14 pr-6 h-14 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-muted-foreground/40 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="primary-action w-full h-14 text-base font-bold uppercase tracking-wider"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </button>
      </form>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">or</span>
        <div className="flex-grow border-t border-border" />
      </div>

      <button
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full h-14 flex items-center justify-center gap-2 bg-white border border-border rounded-2xl text-foreground font-bold text-sm hover:bg-secondary transition-all disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        Send Magic Link
      </button>

      <div className="pt-6 border-t border-border">
        <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-widest">
          New citizen?{" "}
          <Link href="/register" className="text-primary hover:underline inline-flex items-center">
            Register <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </p>
      </div>
    </div>
  );
}
