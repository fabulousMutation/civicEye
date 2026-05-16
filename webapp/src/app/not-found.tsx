import Link from 'next/link';
import { Shield, ArrowLeft, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-scale-in">
        {/* Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 animate-float">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-warning rounded-full flex items-center justify-center border-2 border-background">
            <span className="text-background font-black text-xs">?</span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Error 404</p>
          <h1 className="text-5xl font-black tracking-tighter gradient-text">Off the Map</h1>
          <p className="text-muted-foreground leading-relaxed">
            This page doesn&apos;t exist in our city records. The issue you&apos;re looking for may have moved or been removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="primary-action w-full h-14 text-base font-bold">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
          <Link href="/map" className="w-full h-12 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <MapPin className="w-4 h-4 text-primary" /> Browse the Map
          </Link>
        </div>

        {/* Breadcrumb hint */}
        <p className="text-[10px] text-muted-foreground/50 font-medium">
          CivicEye · AI-Powered Civic Reporting
        </p>
      </div>
    </main>
  );
}
