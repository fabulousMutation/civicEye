export default function Loading() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="font-black text-sm text-foreground">Loading</p>
          <p className="text-[10px] text-muted-foreground font-medium">CivicEye · AI Civic Platform</p>
        </div>
      </div>
    </main>
  );
}
