import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AccountDrop, SubAccount, CATEGORY_COLORS, fetchAccountBySlug, fetchSubAccounts } from '@/lib/accounts';
import { ArrowLeft, Copy, CheckCircle2, Download, Gamepad2, ShieldCheck, ChevronDown } from 'lucide-react';
import { AdSlot, loadAds } from '@/components/AdSlot';
import { StickyDetailLayout } from '@/components/StickyDetailLayout';
import { SEOHead } from '@/components/SEOHead';
import { VipPromo } from '@/components/VipPromo';
import thumbSteam from '@/assets/thumb-steam.jpg';
import thumbCrunchyroll from '@/assets/thumb-crunchyroll.jpg';
import thumbNetflix from '@/assets/thumb-netflix.jpg';
import thumbSpotify from '@/assets/thumb-spotify.jpg';
import thumbDisney from '@/assets/thumb-disney.jpg';

const THUMBNAILS: Record<string, string> = {
  Steam: thumbSteam, Crunchyroll: thumbCrunchyroll, Netflix: thumbNetflix,
  Spotify: thumbSpotify, 'Disney+': thumbDisney,
};

const AccountReveal = () => {
  const { slug } = useParams<{ slug: string }>();
  const [account, setAccount] = useState<AccountDrop | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      Promise.all([fetchAccountBySlug(slug), loadAds()])
        .then(async ([acc]) => {
          setAccount(acc);
          if (acc) {
            const subs = await fetchSubAccounts(acc.id);
            setSubAccounts(subs);
            if (subs.length > 0) setExpandedSub(subs[0].id);
          }
        })
        .catch(() => setAccount(null))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, [slug]);

  const handleCopy = (value: string, type: string) => {
    navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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
  const isMultiAccount = subAccounts.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${account.title} Revealed | Ancient Blood`}
        description={`Access free ${account.category} account: ${account.title}`}
        canonical={`https://ancientblood.online/account/${account.slug}/reveal`}
        ogImage={thumb} ogType="article"
      />

      <nav className="border-b border-border sticky top-0 z-50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href={`/account/${account.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <span className="text-sm font-semibold text-foreground truncate">
            {isMultiAccount ? `${account.title} (${subAccounts.length} accounts)` : account.category === 'Netflix' && account.netflixType === 'cookies' ? 'Cookie Details' : 'Account Details'}
          </span>
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-md" style={{ backgroundColor: color, color: '#fff' }}>
            {icon} {account.category}
          </span>
        </div>
      </nav>

      <StickyDetailLayout>
        <div className="px-4 py-8">
          <div className="mb-5"><AdSlot slotName="detail_top" fallbackHeight="h-[90px]" /></div>

          <div className="rounded-xl overflow-hidden border border-border mb-6">
            {thumb ? <img src={thumb} alt={account.title} className="w-full object-cover" />
              : <div className="w-full h-48 flex items-center justify-center text-5xl bg-muted">{icon}</div>}
          </div>

          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{account.title}</h1>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-md shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Unlocked</span>
            </div>
          </div>

          {isMultiAccount && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">📌 Some accs may stop working but you can check regularly here as new drops</p>
            </div>
          )}

          {/* Multi-account accordion view */}
          {isMultiAccount ? (
            <div className="space-y-2 mb-5">
              {subAccounts.map((sub, i) => {
                const isOpen = expandedSub === sub.id;
                return (
                  <div key={sub.id} className="border border-border rounded-xl overflow-hidden bg-card">
                    <button
                      onClick={() => setExpandedSub(isOpen ? null : sub.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-primary w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {sub.label || `${account.category} ${i + 1}`}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        {/* Credentials */}
                        <div className="space-y-2">
                          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Credentials</h3>
                          <CredentialRow label="Username / Email" value={sub.email} copied={copied === `email-${sub.id}`} onCopy={() => handleCopy(sub.email, `email-${sub.id}`)} />
                          <CredentialRow label="Password" value={sub.password} copied={copied === `pass-${sub.id}`} onCopy={() => handleCopy(sub.password, `pass-${sub.id}`)} />
                        </div>

                        {/* Games */}
                        {sub.games && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Games</h3>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {sub.games.split(',').map((game, gi) => (
                                <span key={gi} className="text-[11px] font-medium bg-muted text-foreground px-2.5 py-1 rounded-md">{game.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {sub.notes && (
                          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">💡 {sub.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Single account view (original) */}
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {account.category === 'Netflix' && account.netflixType === 'cookies' ? 'Cookie File' : 'Credentials'}
                </h2>

                {account.category === 'Netflix' && account.netflixType === 'cookies' ? (
                  <div className="space-y-3">
                    {account.cookieFile && (
                      <a href={account.cookieFile} download={account.cookieFileName || 'cookies.rar'}
                        className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
                        <Download className="w-4 h-4" /> Download {account.cookieFileName || 'cookies.rar'}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground bg-muted rounded-lg px-4 py-3">
                      🍪 Import cookies into your browser using a cookie editor extension.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <CredentialRow label="Username / Email" value={account.email} copied={copied === 'email'} onCopy={() => handleCopy(account.email, 'email')} />
                    <CredentialRow label="Password" value={account.password} copied={copied === 'password'} onCopy={() => handleCopy(account.password, 'password')} />
                  </div>
                )}
              </div>

              {account.category === 'Steam' && account.games && (
                <div className="bg-card border border-border rounded-xl p-5 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 className="w-4 h-4 text-primary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steam Library</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {account.games.split(',').map((game, i) => (
                      <span key={i} className="text-xs font-medium bg-muted text-foreground px-3 py-1.5 rounded-md">{game.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {account.category === 'Crunchyroll' && account.planDetails && (
                <div className="bg-card border border-border rounded-xl p-5 mb-5 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plan:</span>
                  <span className="text-sm font-bold text-foreground">{account.planDetails}</span>
                </div>
              )}
            </>
          )}

          {account.notes && !isMultiAccount && (
            <div className="bg-muted rounded-xl px-5 py-4 mb-8">
              <p className="text-xs text-muted-foreground leading-relaxed">💡 {account.notes}</p>
            </div>
          )}

          <div className="mb-6"><VipPromo /></div>

          <div className="mb-8"><AdSlot slotName="detail_bottom" fallbackHeight="h-[250px]" /></div>

          <div className="border-t border-border pt-6">
            <h2 className="text-xs font-semibold text-foreground mb-1">Disclaimer</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Accounts are public and gathered from open sources. We don't support illegal activities. Use responsibly.
            </p>
          </div>
        </div>
      </StickyDetailLayout>

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[998] bg-background border-t border-border">
        <AdSlot slotName="mobile_sticky" fallbackHeight="h-[50px]" />
      </div>
    </div>
  );
};

function CredentialRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3 gap-3">
      <div className="min-w-0">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5 font-semibold">{label}</span>
        <span className="text-sm font-mono text-foreground truncate block">{value}</span>
      </div>
      <button onClick={onCopy} className="shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors">
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default AccountReveal;
