import { useState, useEffect, useMemo } from 'react';
import { AccountDrop, fetchAccounts } from '@/lib/accounts';
import { AccountCard } from '@/components/AccountCard';
import { AccountCardSkeleton } from '@/components/AccountCardSkeleton';
import { RightSidebar } from '@/components/RightSidebar';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, Megaphone, ExternalLink, LogIn, LogOut, Shield, User, Search, X, Crown } from 'lucide-react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { AdSlot } from '@/components/AdSlot';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import logo from '@/assets/logo.webp';
import { SEOHead } from '@/components/SEOHead';

const Index = () => {
  const { user, isAdmin, isVip, signOut, displayName, avatarUrl } = useAuth();
  const onlineCount = useOnlineUsers();
  const [accounts, setAccounts] = useState<AccountDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetchAccounts().then(setAccounts),
      supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setAnnouncements(data as any[]); }),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => searchQuery
      ? accounts.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()))
      : accounts,
    [accounts, searchQuery]
  );

  const visible = useMemo(() => (showAll ? filtered : filtered.slice(0, 6)), [filtered, showAll]);
  const available = accounts.filter(a => !a.isClaimed).length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Ancient Blood - Free Premium Accounts Daily"
        description="Get free premium accounts daily — Steam, Netflix, Spotify, Crunchyroll, Disney+ and more. First come first served drops every day."
        canonical="https://ancientblood.online/"
        ogImage="https://ancientblood.online/logo.webp"
        jsonLd={{
          '@context': 'https://schema.org', '@type': 'WebSite', name: 'Ancient Blood',
          url: 'https://ancientblood.online',
          description: 'Free premium account drops daily — Steam, Netflix, Spotify, Crunchyroll, Disney+ and more.',
          potentialAction: { '@type': 'SearchAction', target: 'https://ancientblood.online/?q={search_term_string}', 'query-input': 'required name=search_term_string' },
        }}
      />
      <AnnouncementBanner />

      {/* Nav */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Ancient Blood" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-foreground hidden sm:inline">Ancient Blood</span>
          </a>
          <div className="flex items-center gap-3 sm:gap-5">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground items-center gap-1.5 hidden sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              {onlineCount}
            </span>
            <span className="text-xs font-medium text-primary">{available} drops</span>
            <a href="/vip" className="text-xs font-semibold text-warning hover:text-warning/80 transition-colors flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> VIP
            </a>
            {isAdmin && (
              <a href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
              </a>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <a href="/profile" className="flex items-center gap-1.5">
                  <Avatar className="w-6 h-6">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                    <AvatarFallback className="text-[10px] bg-muted"><User className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                </a>
                <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <a href="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input autoFocus type="text" placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Free Premium<br />
            <span className="text-primary">Account Drops</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
            Steam, Netflix, Spotify & more — fresh drops daily, first come first served.
          </p>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              <Megaphone className="w-3.5 h-3.5 text-primary" /> News
            </h2>
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.message}</p>
                    {a.link_text && a.link_url && (
                      <a href={a.link_url} target="_blank" rel="noopener noreferrer" data-allow-external="true"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                        {a.link_text} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <AdSlot slotName="hero_below" fallbackHeight="h-[90px]" />
      </div>

      {/* Main feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <AccountCardSkeleton key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <p className="text-4xl mb-3">🎮</p>
                <h3 className="text-base font-semibold text-foreground mb-1">No drops yet</h3>
                <p className="text-sm text-muted-foreground">Check back soon for new accounts.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visible.map((account, i) => (
                    <div key={account.id} className="contents">
                      <AccountCard account={account} />
                      {i === 3 && visible.length > 4 && (
                        <div className="sm:col-span-2">
                          <AdSlot slotName="feed_between" fallbackHeight="h-[60px]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {filtered.length > 6 && (
                  <div className="text-center mt-8">
                    <button onClick={() => setShowAll(!showAll)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {showAll ? 'Show less' : `View all ${filtered.length}`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:block w-[300px] shrink-0 sticky top-20">
            <RightSidebar accounts={accounts} />
          </div>
        </div>

        <div className="lg:hidden mt-10">
          <RightSidebar accounts={accounts} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <AdSlot slotName="footer_above" fallbackHeight="h-[90px]" />
      </div>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Ancient Blood</span> · New accounts every day
          </p>
          <div className="flex items-center gap-4">
            <a href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="/about#faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
