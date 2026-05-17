'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-scale-in">
        <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto border border-danger/20">
          <AlertTriangle className="w-10 h-10 text-danger" />
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-danger/70">Unexpected Error</p>
          <h1 className="text-4xl font-black tracking-tighter">Something Went Wrong</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            An unexpected error occurred. Our team has been notified. Please try again or return home.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-muted-foreground/50">Digest: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="primary-action w-full h-14 text-base font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link href="/" className="w-full h-12 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
