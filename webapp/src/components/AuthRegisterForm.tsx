"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";

export default function AuthRegisterForm() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMsg("Check your email to verify your account.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-black tracking-tighter">Join CivicEye</h1>
        <p className="text-muted-foreground text-sm font-medium">Create your citizen account</p>
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

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="relative">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full pl-14 pr-6 h-14 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-muted-foreground/40 transition-all"
            placeholder="Full Name"
          />
        </div>

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
            required
            minLength={6}
            className="w-full pl-14 pr-6 h-14 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-muted-foreground/40 transition-all"
            placeholder="••••••••  (min 6 characters)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="primary-action w-full h-14 text-base font-bold uppercase tracking-wider"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
        </button>
      </form>

      <div className="pt-6 border-t border-border">
        <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-widest">
          Already a citizen?{" "}
          <Link href="/login" className="text-primary hover:underline inline-flex items-center">
            Sign In <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </p>
      </div>
    </div>
  );
}
