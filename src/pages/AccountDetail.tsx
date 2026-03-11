import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AccountDrop, CATEGORY_COLORS, fetchAccountBySlug, claimAccount } from '@/lib/accounts';
import { ArrowLeft, AlertTriangle, Timer, Shield } from 'lucide-react';
import { AdSlot, loadAds } from '@/components/AdSlot';
import { StickyDetailLayout } from '@/components/StickyDetailLayout';
import { SEOHead } from '@/components/SEOHead';
import { CommentSection } from '@/components/CommentSection';
import { VipPromo } from '@/components/VipPromo';
import { useAuth } from '@/hooks/useAuth';
import thumbSteam from '@/assets/thumb-steam.jpg';
import thumbCrunchyroll from '@/assets/thumb-crunchyroll.jpg';
import thumbNetflix from '@/assets/thumb-netflix.jpg';
import thumbSpotify from '@/assets/thumb-spotify.jpg';
import thumbDisney from '@/assets/thumb-disney.jpg';

const THUMBNAILS: Record<string, string> = {
  Steam: thumbSteam, Crunchyroll: thumbCrunchyroll, Netflix: thumbNetflix,
  Spotify: thumbSpotify, 'Disney+': thumbDisney,
};

const COUNTDOWN_SECONDS = 10;

const AccountDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isVip } = useAuth();
  const [account, setAccount] = useState<AccountDrop | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchAccountBySlug(slug).then(setAccount).catch(() => setAccount(null)).finally(() => setLoading(false));
      loadAds();
    } else setLoading(false);
  }, [slug]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && account) {
      if (!account.isClaimed) claimAccount(account.id);
      window.location.href = `/account/${account.slug}/reveal`;
    }
  }, [countdown, account]);

  const handleAccountClick = useCallback((e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isVip && account) {
      if (!account.isClaimed) claimAccount(account.id);
      window.location.href = `/account/${account.slug}/reveal`;
      return;
    }
    if (countdown === null) setCountdown(COUNTDOWN_SECONDS);
  }, [countdown, isVip, account]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-3">Not Found</h2>
          <a href="/" className="text-primary text-sm hover:underline">← Back to home</a>
        </div>
      </div>
    );
  }

  const { color, icon } = CATEGORY_COLORS[account.category];
  const thumb = account.screenshot || THUMBNAILS[account.category];
  const isCountingDown = countdown !== null && countdown > 0;
  const progress = isCountingDown ? ((COUNTDOWN_SECONDS - countdown!) / COUNTDOWN_SECONDS) * 100 : 0;
  const pageUrl = `https://ancientblood.online/account/${account.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${account.title} - Free ${account.category} Account | Ancient Blood`}
        description={`Get a free ${account.category} account: ${account.title}. ${account.notes || 'Claim before it\'s gone.'}`}
        canonical={pageUrl} ogImage={thumb} ogType="article"
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'Article', headline: account.title,
          description: account.notes || `Free ${account.category} account drop`,
          image: thumb, datePublished: account.droppedAt,
          publisher: { '@type': 'Organization', name: 'Ancient Blood' },
        }}
      />

      <nav className="border-b border-border sticky top-0 z-50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></a>
          <span className="text-sm font-semibold text-foreground truncate flex-1">{account.title}</span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md" style={{ backgroundColor: color, color: '#fff' }}>
            {icon} {account.category}
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <StickyDetailLayout>
          {/* Top banner ad — far from buttons */}
          <div className="my-10"><AdSlot slotName="detail_top" fallbackHeight="h-[90px]" /></div>

          <article>
            {/* Account info section */}
            <div className="rounded-xl overflow-hidden border border-border mb-8">
              {thumb ? (
                <img src={thumb} alt={account.title} className="w-full object-cover" loading="eager" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center text-5xl bg-muted">{icon}</div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{account.title}</h1>
            {account.notes && <p className="text-sm text-muted-foreground mb-6">{account.notes}</p>}

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold text-foreground mb-0.5">Ad-Supported</h3>
                  <p className="text-xs text-muted-foreground">This platform is ad-funded to keep offering free access.</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                <span className="text-base mt-0.5">💬</span>
                <div>
                  <h3 className="text-xs font-semibold text-foreground mb-0.5">Community</h3>
                  <a href="#" className="text-xs font-medium text-primary hover:underline">Join our Discord →</a>
                </div>
              </div>
            </div>

            {/* Middle banner ad — between info and action button, with large spacing */}
            <div className="my-10"><AdSlot slotName="detail_mid" fallbackHeight="h-[250px]" /></div>

            {/* Warning + Unlock section — 60px+ away from any ad */}
            <div className="bg-destructive/10 border border-destructive/20 text-center py-3 px-4 rounded-lg mb-5 flex items-center justify-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-destructive">Ignore fake pop-ups in ads — close them and return here.</span>
            </div>

            <section className="text-center py-8 mb-5 bg-card rounded-xl border border-border">
              <p className="text-sm text-muted-foreground mb-5">Click below to unlock account details</p>

              {!isCountingDown && (
                <button onClick={handleAccountClick}
                  className="font-bold text-base px-7 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer glow-sm">
                  Get Account
                </button>
              )}

              {isCountingDown && (
                <div className="max-w-[240px] mx-auto">
                  <div className="border border-border rounded-xl p-6 bg-muted/50">
                    <Timer className="w-5 h-5 text-primary mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-muted-foreground mb-1">Unlocking in</p>
                    <div className="text-3xl font-bold text-foreground mb-3 font-mono">{countdown}</div>
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-linear bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="mb-5"><VipPromo /></div>
            <div className="mb-8"><CommentSection accountId={account.id} /></div>

            {/* Footer banner ad — far below the button */}
            <div className="my-10"><AdSlot slotName="detail_bottom" fallbackHeight="h-[250px]" /></div>
          </article>

          <footer className="border-t border-border pt-6">
            <h2 className="text-xs font-semibold text-foreground mb-1">Disclaimer</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Accounts are public and gathered from open sources. We don't support illegal activities. Accounts are shared as-is. Use responsibly.
            </p>
          </footer>
        </StickyDetailLayout>
      </main>

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[998] bg-background border-t border-border">
        <AdSlot slotName="mobile_sticky" fallbackHeight="h-[50px]" />
      </div>

      <footer className="border-t border-border py-6 pb-16 xl:pb-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Ancient Blood</span> · New accounts every day</p>
        </div>
      </footer>
    </div>
  );
};

export default AccountDetail;
