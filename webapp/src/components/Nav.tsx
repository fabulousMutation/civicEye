import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default async function Nav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors group shrink-0">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-black text-base tracking-tight">CivicEye</span>
        </Link>

        {/* Center links — logged-in only */}
        {user && (
          <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
            {[
              { href: '/',          label: 'Home' },
              { href: '/map',       label: '🗺️ Map' },
              { href: '/dashboard', label: '📊 Dashboard' },
              { href: '/insights',  label: '💡 Insights' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-secondary whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1 shrink-0">
          {user ? (
            <>
              <NotificationBell />
              <Link href="/profile" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-secondary">
                Profile
              </Link>
              <Link href="/report" className="primary-action h-9 px-4 text-xs shadow-md shadow-primary/20">
                + Report
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-secondary">
                Sign In
              </Link>
              <Link href="/register" className="primary-action h-9 px-4 text-xs shadow-md shadow-primary/20">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
