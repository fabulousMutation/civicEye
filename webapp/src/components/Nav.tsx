import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";

export default async function Nav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-black text-base tracking-tight">CivicEye</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Profile
              </Link>
              <Link href="/report" className="primary-action h-9 px-4 text-xs">
                + Report
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Sign In
              </Link>
              <Link href="/register" className="primary-action h-9 px-4 text-xs">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
