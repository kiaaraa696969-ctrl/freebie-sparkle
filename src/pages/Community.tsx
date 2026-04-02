import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_COLORS, AccountCategory } from '@/lib/accounts';
import { SEOHead } from '@/components/SEOHead';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { Plus, Trash2, Clock, CheckCircle2, XCircle, LogIn, ArrowLeft, Users, Send, Search, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logo from '@/assets/logo.webp';
import { ContributorLeaderboard } from '@/components/ContributorLeaderboard';

interface CommunityDrop {
  id: string;
  user_id: string;
  title: string;
  category: string;
  email: string;
  password: string;
  status: string;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const CATEGORIES: AccountCategory[] = ['Steam', 'Crunchyroll', 'Netflix', 'Spotify', 'Disney+', 'Other'];
const ALL_FILTER = 'All';

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function PasswordField({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-foreground font-mono truncate">
        {visible ? password : '••••••••'}
      </span>
      <button onClick={() => setVisible(!visible)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
      {visible && <CopyButton text={password} />}
    </div>
  );
}

export default function Community() {
  const { user } = useAuth();
  const [drops, setDrops] = useState<CommunityDrop[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AccountCategory>('Steam');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'approved' | 'my'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState(ALL_FILTER);

  const fetchDrops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('community_drops')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setDrops(data as CommunityDrop[]);
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map((d: any) => d.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        if (profileData) {
          const map: Record<string, Profile> = {};
          profileData.forEach((p: Profile) => { map[p.user_id] = p; });
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchDrops(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');

    if (!title.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);

    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'community_auto_approve')
      .maybeSingle();

    const autoApprove = setting?.value === 'true';

    const { error: insertError } = await supabase
      .from('community_drops')
      .insert({
        user_id: user.id,
        title: title.trim(),
        category,
        email: email.trim(),
        password: password.trim(),
        status: autoApprove ? 'approved' : 'pending',
        ...(autoApprove ? { approved_at: new Date().toISOString() } : {}),
      });

    if (insertError) {
      setError('Failed to submit drop. Try again.');
      console.error(insertError);
    } else {
      setSuccess(autoApprove ? 'Drop published!' : 'Drop submitted for review!');
      setTitle('');
      setEmail('');
      setPassword('');
      setShowForm(false);
      fetchDrops();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('community_drops').delete().eq('id', id);
    fetchDrops();
  };

  const approvedDrops = drops.filter(d => d.status === 'approved');
  const myDrops = user ? drops.filter(d => d.user_id === user.id) : [];

  const filteredDrops = useMemo(() => {
    const base = tab === 'approved' ? approvedDrops : myDrops;
    return base.filter(d => {
      const matchesSearch = searchQuery.trim() === '' ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === ALL_FILTER || d.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tab, approvedDrops, myDrops, searchQuery, filterCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Community Drops — Ancient Blood"
        description="Community-submitted premium account drops. Share and discover free accounts."
      />
      <AnnouncementBanner />

      {/* Nav */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Ancient Blood" className="w-7 h-7 object-contain" />
            <span className="text-base font-bold text-foreground hidden sm:inline">Ancient Blood</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Community Drops
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Share accounts with the community — help others out!
            </p>
          </div>
          {user ? (
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Drop an Account
            </Button>
          ) : (
            <a href="/auth">
              <Button size="sm" variant="outline" className="gap-1.5">
                <LogIn className="w-4 h-4" /> Sign in to Drop
              </Button>
            </a>
          )}
        </div>

        {/* Submit Form */}
        {showForm && user && (
          <div className="bg-card rounded-xl border border-border p-5 mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Submit a Drop
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Title (e.g. Netflix Premium)" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
                <Select value={category} onValueChange={(v) => setCategory(v as AccountCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{CATEGORY_COLORS[c].icon} {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Email / Username" value={email} onChange={e => setEmail(e.target.value)} maxLength={255} />
                <Input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} maxLength={255} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {success && <p className="text-xs text-green-500">{success}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Drop'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Leaderboard */}
        <ContributorLeaderboard />

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search drops..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{CATEGORY_COLORS[c].icon} {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('approved')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer ${tab === 'approved' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Approved ({approvedDrops.length})
          </button>
          {user && (
            <button
              onClick={() => setTab('my')}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer ${tab === 'my' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My Drops ({myDrops.length})
            </button>
          )}
        </div>

        {/* Drops Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterCategory !== ALL_FILTER
                ? 'No drops match your search.'
                : tab === 'approved' ? 'No community drops yet. Be the first!' : 'You haven\'t submitted any drops yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrops.map(drop => {
              const catInfo = CATEGORY_COLORS[drop.category as AccountCategory] || CATEGORY_COLORS.Other;
              const profile = profiles[drop.user_id];
              return (
                <div key={drop.id} className="bg-card rounded-xl border border-border overflow-hidden group">
                  {/* Category header */}
                  <div className="h-20 flex items-center justify-center text-4xl" style={{ backgroundColor: catInfo.color + '18' }}>
                    {catInfo.icon}
                  </div>
                  <div className="p-4">
                    {/* Dropper profile */}
                    <div className="flex items-center gap-2 mb-3">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                          {(profile?.display_name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] text-muted-foreground truncate">
                        {profile?.display_name || 'Anonymous'}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {getTimeAgo(drop.created_at)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: catInfo.color, color: '#fff' }}>
                          {catInfo.icon} {drop.category}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground mt-2 truncate">{drop.title}</h3>
                      </div>
                      {drop.is_claimed && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Claimed</span>
                      )}
                    </div>

                    {/* Credentials */}
                    {(tab === 'approved' || tab === 'my') && (
                      <div className="mt-3 space-y-1.5 bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">Email</span>
                          <span className="text-xs text-foreground font-mono truncate flex-1">{drop.email}</span>
                          <CopyButton text={drop.email} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">Pass</span>
                          <div className="flex-1 min-w-0">
                            <PasswordField password={drop.password} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status badges for My Drops */}
                    {tab === 'my' && (
                      <div className="flex items-center justify-end gap-1.5 mt-3">
                        {drop.status === 'pending' && (
                          <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {drop.status === 'approved' && (
                          <span className="text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {drop.status === 'rejected' && (
                          <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                        {drop.status === 'pending' && (
                          <button onClick={() => handleDelete(drop.id)} className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}