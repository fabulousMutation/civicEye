"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight, Sparkles, Eye, EyeOff, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Maps raw Supabase error messages to user-friendly explanations with recovery actions.
 */
function getFriendlyError(errorMessage: string): { title: string; message: string; isRateLimit: boolean } {
  const lower = errorMessage.toLowerCase();

  // Rate-limiting / "login exceeds" errors
  if (lower.includes('request this after') || lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('login exceeds') || lower.includes('exceeded')) {
    return {
      title: 'Too Many Login Attempts',
      message: 'You\'ve exceeded the login attempt limit. Please wait 60 seconds before trying again, or use the Magic Link option below to bypass this.',
      isRateLimit: true,
    };
  }

  // Session concurrency errors
  if (lower.includes('session') || lower.includes('active sessions') || lower.includes('concurren')) {
    return {
      title: 'Session Limit Reached',
      message: 'You have too many active sessions. Use "Force Reset" below to sign out from all devices, then try logging in again.',
      isRateLimit: true,
    };
  }

  // Invalid credentials
  if (lower.includes('invalid login credentials') || lower.includes('invalid password') || lower.includes('wrong password')) {
    return {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect. Double-check and try again.',
      isRateLimit: false,
    };
  }

  // Email not confirmed
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return {
      title: 'Email Not Verified',
      message: 'Please check your inbox and verify your email address before signing in.',
      isRateLimit: false,
    };
  }

  // User not found
  if (lower.includes('user not found') || lower.includes('no user')) {
    return {
      title: 'Account Not Found',
      message: 'No account exists with this email. Please register first.',
      isRateLimit: false,
    };
  }

  // Generic fallback
  return {
    title: 'Sign-In Error',
    message: errorMessage,
    isRateLimit: false,
  };
}

export default function AuthLoginForm() {
  const router = useRouter();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setErrorTitle("");
    setIsRateLimit(false);
    setMsg("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      const friendly = getFriendlyError(error.message);
      setErrorTitle(friendly.title);
      setErrorMsg(friendly.message);
      setIsRateLimit(friendly.isRateLimit);
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setErrorTitle("Email Required");
      setErrorMsg("Enter your email first to receive a magic link.");
      setIsRateLimit(false);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setErrorTitle("");
    setIsRateLimit(false);
    setMsg("");
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const friendly = getFriendlyError(error.message);
      setErrorTitle(friendly.title);
      setErrorMsg(friendly.message);
      setIsRateLimit(friendly.isRateLimit);
    } else {
      setMsg("Magic link sent! Check your inbox.");
    }
    setLoading(false);
  };

  const handleForceReset = async () => {
    setResetting(true);
    try {
      // Sign out from all sessions (scope: 'global' clears all devices)
      await supabase.auth.signOut({ scope: 'global' });
      setErrorMsg("");
      setErrorTitle("");
      setIsRateLimit(false);
      setMsg("All sessions cleared! You can now sign in again.");
    } catch {
      setMsg("Reset attempted. Please try logging in now.");
    }
    setResetting(false);
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-black tracking-tighter">Welcome Back</h1>
        <p className="text-muted-foreground text-sm font-medium">Sign into your CivicEye account</p>
      </div>
      
      {errorMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${isRateLimit ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-400'}`}>
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
                  className={`mt-2 w-full h-10 flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-all ${isRateLimit ? 'bg-amber-200 text-amber-800 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700' : 'bg-red-200 text-red-800 hover:bg-red-300'} disabled:opacity-50`}
                >
                  {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {resetting ? 'Resetting...' : 'Force Reset All Sessions'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold text-center dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-14 pr-14 h-14 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary text-base font-medium placeholder:text-muted-foreground/40 transition-all"
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
        className="w-full h-14 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl text-foreground font-bold text-sm hover:bg-muted transition-all disabled:opacity-50"
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

