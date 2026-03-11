import { ShieldAlert, RefreshCw, Crown, Ban, Zap } from 'lucide-react';

interface AdBlockOverlayProps { onRecheck: () => void; }

export function AdBlockOverlay({ onRecheck }: AdBlockOverlayProps) {
  return (
    <div className="fixed inset-0 z-[99999] bg-background/98 backdrop-blur-xl flex items-center justify-center p-4" style={{ pointerEvents: 'all' }}>
      <div className="max-w-lg w-full space-y-6">
        {/* Main Card */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Ad Blocker Detected</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              We rely on ads to provide free premium accounts. Please disable your ad blocker to continue browsing.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">How to disable</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Click the <strong className="text-foreground">ad blocker icon</strong> in your toolbar</li>
              <li>Select <strong className="text-foreground">"Disable on this site"</strong></li>
              <li><strong className="text-foreground">Brave</strong>: tap the lion icon → Shields OFF</li>
            </ol>
          </div>

          <button
            onClick={onRecheck}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer w-full justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            I've Disabled It — Refresh
          </button>
        </div>

        {/* VIP Promo Card */}
        <div className="relative overflow-hidden bg-card border border-amber-500/30 rounded-2xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground mb-1">
                Tired of ads? Go <span className="text-amber-500">VIP</span>
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Remove all ads permanently and enjoy exclusive perks.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Ban className="w-3 h-3 text-amber-500" /> No ads ever</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Instant access</span>
                <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> VIP badge</span>
              </div>
            </div>

            <a
              href="/vip"
              className="shrink-0 inline-flex items-center gap-2 bg-amber-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Crown className="w-4 h-4" />
              From $0.99
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/50">Your support keeps free accounts available ❤️</p>
      </div>
    </div>
  );
}
