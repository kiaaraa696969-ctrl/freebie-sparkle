import { useState, useEffect } from 'react';
import { AccountDrop, CATEGORY_COLORS } from '@/lib/accounts';
import { Clock } from 'lucide-react';

interface AccountCardProps {
  account: AccountDrop;
  isImageLoading?: boolean;
}

export function AccountCard({ account, isImageLoading = false }: AccountCardProps) {
  const { color, icon } = CATEGORY_COLORS[account.category];
  const thumb = account.screenshot;
  const timeAgo = getTimeAgo(account.droppedAt);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => { setImageLoaded(false); }, [thumb]);

  return (
    <a href={`/account/${account.slug}`} className="group block bg-card rounded-xl overflow-hidden border border-border card-hover">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {thumb ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
            <img src={thumb} alt={account.title} loading="lazy" onLoad={() => setImageLoaded(true)} onError={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} />
          </>
        ) : isImageLoading ? (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-muted">{icon}</div>
        )}

        <div className="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: color, color: '#fff' }}>
          {icon} {account.category}
        </div>

        {account.isClaimed && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground bg-card px-3 py-1 rounded-md border border-border">Claimed</span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-sm text-foreground mb-2.5 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {account.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
          {!account.isClaimed && (
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Available</span>
          )}
        </div>
      </div>
    </a>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
