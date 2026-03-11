import { Crown, Zap, ShieldOff, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function VipPromo() {
  const { isVip } = useAuth();
  if (isVip) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Go VIP</h3>
            <p className="text-[10px] text-muted-foreground">From $0.99/week</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-foreground"><ShieldOff className="w-3 h-3 text-primary" /> No ads</span>
          <span className="flex items-center gap-1.5 text-xs text-foreground"><Zap className="w-3 h-3 text-primary" /> Instant access</span>
          <span className="flex items-center gap-1.5 text-xs text-foreground"><Star className="w-3 h-3 text-primary" /> VIP badge</span>
        </div>

        <a href="/vip" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity">
          <Crown className="w-3.5 h-3.5" /> Become VIP
        </a>
      </div>
    </div>
  );
}
