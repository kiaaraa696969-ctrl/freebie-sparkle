import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface Contributor {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  count: number;
}

export function ContributorLeaderboard() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      // Get approved drops grouped by user
      const { data: drops } = await supabase
        .from('community_drops')
        .select('user_id')
        .eq('status', 'approved');

      if (!drops || drops.length === 0) {
        setLoading(false);
        return;
      }

      // Count per user
      const countMap: Record<string, number> = {};
      drops.forEach(d => {
        countMap[d.user_id] = (countMap[d.user_id] || 0) + 1;
      });

      const userIds = Object.keys(countMap);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      profiles?.forEach(p => {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      const sorted = userIds
        .map(uid => ({
          user_id: uid,
          display_name: profileMap[uid]?.display_name || null,
          avatar_url: profileMap[uid]?.avatar_url || null,
          count: countMap[uid],
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setContributors(sorted);
      setLoading(false);
    }
    fetch();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="h-4 bg-muted rounded w-1/2 mb-4 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded mb-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (contributors.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-8">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Top Contributors
      </h2>
      <div className="space-y-2">
        {contributors.map((c, i) => (
          <div
            key={c.user_id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              i === 0 ? 'bg-yellow-500/5 border border-yellow-500/20' : 'hover:bg-muted/50'
            }`}
          >
            {getRankIcon(i)}
            {c.avatar_url ? (
              <img src={c.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {(c.display_name || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-foreground flex-1 truncate">
              {c.display_name || 'Anonymous'}
            </span>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {c.count} {c.count === 1 ? 'drop' : 'drops'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
