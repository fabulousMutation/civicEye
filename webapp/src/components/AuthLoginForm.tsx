"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight, Sparkles, Eye, EyeOff, AlertTriangle, RefreshCw, Shield } from "lucide-react";

function getFriendlyError(errorMessage: string): { title: string; message: string; isRateLimit: boolean } {
  const lower = errorMessage.toLowerCase();

  if (lower.includes('request this after') || lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('login exceeds') || lower.includes('exceeded')) {
    return {
      title: 'Too Many Login Attempts',
      message: 'You\'ve exceeded the login attempt limit. Please wait 60 seconds before trying again, or use the Magic Link option below.',
      isRateLimit: true,
    };
  }
  if (lower.includes('session') || lower.includes('active sessions') || lower.includes('concurren')) {
    return {
      title: 'Session Limit Reached',
      message: 'You have too many active sessions. Use "Force Reset" below to sign out from all devices.',
      isRateLimit: true,
    };
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid password') || lower.includes('wrong password')) {
    return {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect. Double-check and try again.',
      isRateLimit: false,
    };
  }
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return {
      title: 'Email Not Verified',
      message: 'Please check your inbox and verify your email address before signing in.',
      isRateLimit: false,
    };
  }
  if (lower.includes('user not found') || lower.includes('no user')) {
    return {
      title: 'Account Not Found',
      message: 'No account exists with this email. Please register first.',
      isRateLimit: false,
    };
  }
  return { title: 'Sign-In Error', message: errorMessage, isRateLimit: false };
}

export default function AuthLoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorTitle, setErrorTitle] = useState("");
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState("");

  const clearErrors = () => { setErrorMsg(""); setErrorTitle(""); setIsRateLimit(false); setMsg(""); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const friendly = getFriendlyError(error.message);
      setErrorTitle(friendly.title);
      setErrorMsg(friendly.message);
      setIsRateLimit(friendly.isRateLimit);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setErrorTitle("Email Required");
      setErrorMsg("Enter your email address first to receive a magic link.");
      return;
    }
    setLoading(true);
    clearErrors();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      const friendly = getFriendlyError(error.message);
      setErrorTitle(friendly.title);
      setErrorMsg(friendly.message);
      setIsRateLimit(friendly.isRateLimit);
    } else {
      setMsg("✨ Magic link sent! Check your inbox.");
    }
    setLoading(false);
  };

  const handleForceReset = async () => {
    setResetting(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      clearErrors();
      setMsg("All sessions cleared. You can now sign in again.");
    } catch {
      setMsg("Reset attempted. Please try logging in now.");
    }
    setResetting(false);
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">Welcome Back</h1>
        <p className="text-muted-foreground text-sm font-medium">Sign into your CivicEye account</p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${
          isRateLimit
            ? 'bg-warning/10 border-warning/20 text-warning'
            : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-black text-sm">{errorTitle}</p>
              <p className="font-medium leading-relaxed">{errorMsg}</p>
              {isRateLimit && (
                <button
                  type="button"
                  onClick={handleForceReset}
                  disabled={resetting}
                  className={`mt-2 w-full h-9 flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-all ${
                    isRateLimit
                      ? 'bg-warning/20 text-warning hover:bg-warning/30'
                      : 'bg-danger/20 text-danger hover:bg-danger/30'
                  } disabled:opacity-50`}
                >
                  {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {resetting ? 'Resetting...' : 'Force Reset All Sessions'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {msg && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl text-xs font-bold text-center">
          {msg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
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
            className="input-field pl-14 pr-14"
            placeholder="••••••••"
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
          id="submit-login"
          disabled={loading}
          className="primary-action w-full h-14 text-base font-bold"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">or</span>
        <div className="flex-grow border-t border-border" />
      </div>

      <button
        id="magic-link-btn"
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full h-14 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl text-foreground font-bold text-sm hover:bg-muted hover:border-primary/20 transition-all disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        Send Magic Link
      </button>

      <div className="pt-6 border-t border-border">
        <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-widest">
          New citizen?{" "}
          <Link href="/register" className="text-primary hover:underline inline-flex items-center gap-1">
            Register <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
