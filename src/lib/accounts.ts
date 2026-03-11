import { supabase } from '@/integrations/supabase/client';

export type AccountCategory = 'Steam' | 'Crunchyroll' | 'Netflix' | 'Spotify' | 'Disney+' | 'Other';

export type NetflixType = 'account' | 'cookies';

export interface AccountDrop {
  id: string;
  slug: string;
  title: string;
  category: AccountCategory;
  email: string;
  password: string;
  notes?: string;
  screenshot?: string;
  isClaimed: boolean;
  claimedAt?: string;
  droppedAt: string;
  thumbnail?: string;
  games?: string;
  netflixType?: NetflixType;
  cookieFile?: string;
  cookieFileName?: string;
  planDetails?: string;
}

export const CATEGORY_COLORS: Record<AccountCategory, { color: string; icon: string }> = {
  Steam: { color: '#4a90d9', icon: '🎮' },
  Crunchyroll: { color: '#f47521', icon: '🍥' },
  Netflix: { color: '#e50914', icon: '🎬' },
  Spotify: { color: '#1db954', icon: '🎵' },
  'Disney+': { color: '#1e4db5', icon: '✨' },
  Other: { color: '#9b59b6', icon: '🎁' },
};

function generateSlug(title: string, id: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    id.slice(0, 8)
  );
}

// Map DB row to AccountDrop
function mapRow(row: any): AccountDrop {
  return {
    id: row.id,
    slug: row.slug || generateSlug(row.title, row.id),
    title: row.title,
    category: row.category as AccountCategory,
    email: row.email,
    password: row.password,
    notes: row.notes || undefined,
    screenshot: row.screenshot || undefined,
    isClaimed: row.is_claimed,
    claimedAt: row.claimed_at || undefined,
    droppedAt: row.dropped_at,
    thumbnail: row.thumbnail || undefined,
    games: row.games || undefined,
    netflixType: row.netflix_type as NetflixType | undefined,
    cookieFile: row.cookie_file || undefined,
    cookieFileName: row.cookie_file_name || undefined,
    planDetails: row.plan_details || undefined,
  };
}

export async function fetchAccounts(): Promise<AccountDrop[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, slug, title, category, is_claimed, claimed_at, dropped_at, thumbnail, plan_details, games, netflix_type, cookie_file_name, screenshot')
    .order('dropped_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('Failed to fetch accounts:', error);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function fetchAccountScreenshots(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const results = await Promise.all(
    ids.map(async (id) => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, screenshot')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Failed to fetch account screenshot for ${id}:`, error);
        return null;
      }

      if (!data?.screenshot) return null;
      return { id: data.id, screenshot: data.screenshot };
    })
  );

  return results.reduce<Record<string, string>>((acc, item) => {
    if (item) acc[item.id] = item.screenshot;
    return acc;
  }, {});
}

export async function fetchAccountById(id: string): Promise<AccountDrop | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function fetchAccountBySlug(slug: string): Promise<AccountDrop | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function claimAccount(id: string): Promise<void> {
  await supabase
    .from('accounts')
    .update({ is_claimed: true, claimed_at: new Date().toISOString() })
    .eq('id', id);
}

export async function addAccount(account: Omit<AccountDrop, 'id' | 'slug' | 'isClaimed' | 'droppedAt'>): Promise<AccountDrop | null> {
  const tempId = crypto.randomUUID();
  const slug = generateSlug(account.title, tempId);
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      title: account.title,
      category: account.category,
      email: account.email,
      password: account.password,
      notes: account.notes || null,
      screenshot: account.screenshot || null,
      games: account.games || null,
      netflix_type: account.netflixType || null,
      cookie_file: account.cookieFile || null,
      cookie_file_name: account.cookieFileName || null,
      plan_details: account.planDetails || null,
      slug: slug,
    })
    .select()
    .single();
  if (error) {
    console.error('Failed to add account:', error);
    return null;
  }
  // Update slug with actual id
  const finalSlug = generateSlug(account.title, data.id);
  if (finalSlug !== slug) {
    await supabase.from('accounts').update({ slug: finalSlug }).eq('id', data.id);
    data.slug = finalSlug;
  }
  return mapRow(data);
}

export async function deleteAccount(id: string): Promise<void> {
  await supabase.from('accounts').delete().eq('id', id);
}

export async function resetClaim(id: string): Promise<void> {
  await supabase
    .from('accounts')
    .update({ is_claimed: false, claimed_at: null })
    .eq('id', id);
}

export interface SubAccount {
  id: string;
  accountId: string;
  label: string;
  email: string;
  password: string;
  games?: string;
  cookieFile?: string;
  cookieFileName?: string;
  notes?: string;
  sortOrder: number;
}

export async function fetchSubAccounts(accountId: string): Promise<SubAccount[]> {
  const { data, error } = await supabase
    .from('sub_accounts')
    .select('*')
    .eq('account_id', accountId)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    accountId: row.account_id,
    label: row.label,
    email: row.email,
    password: row.password,
    games: row.games || undefined,
    cookieFile: row.cookie_file || undefined,
    cookieFileName: row.cookie_file_name || undefined,
    notes: row.notes || undefined,
    sortOrder: row.sort_order,
  }));
}

export async function addSubAccounts(accountId: string, subs: Omit<SubAccount, 'id' | 'accountId'>[]): Promise<void> {
  if (subs.length === 0) return;
  const rows = subs.map((s, i) => ({
    account_id: accountId,
    label: s.label,
    email: s.email,
    password: s.password,
    games: s.games || null,
    cookie_file: s.cookieFile || null,
    cookie_file_name: s.cookieFileName || null,
    notes: s.notes || null,
    sort_order: i,
  }));
  await supabase.from('sub_accounts').insert(rows);
}
