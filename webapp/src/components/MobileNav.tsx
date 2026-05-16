'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Camera, BarChart3, User } from 'lucide-react';

const LINKS = [
  { href: '/',          icon: Home,     label: 'Home'      },
  { href: '/map',       icon: Map,      label: 'Map'       },
  { href: '/report',    icon: Camera,   label: 'Report',   primary: true },
  { href: '/dashboard', icon: BarChart3, label: 'Stats'    },
  { href: '/profile',   icon: User,     label: 'Profile'   },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {LINKS.map(({ href, icon: Icon, label, primary }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
                primary
                  ? 'relative'
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={label}
            >
              {primary ? (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-95 ${
                  isActive ? 'bg-primary/90' : 'bg-primary'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-primary' : ''}`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
