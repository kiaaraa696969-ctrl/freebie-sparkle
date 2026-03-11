import { useState, useEffect } from 'react';
import { AccountDrop, AccountCategory, NetflixType, CATEGORY_COLORS, fetchAccounts, addAccount, deleteAccount, resetClaim } from '@/lib/accounts';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, Zap, LogOut, RotateCcw, CheckCircle2, ImagePlus, X, FileArchive, Megaphone, Power, MonitorPlay, Save, Webhook, Link2, ArrowUp, ArrowDown, Crown, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invalidateAdCache } from '@/components/AdSlot';
import { AccountDropForm } from '@/components/admin/AccountDropForm';

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [accounts, setAccounts] = useState<AccountDrop[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementLinkText, setAnnouncementLinkText] = useState('');
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('');
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [adSaving, setAdSaving] = useState<string | null>(null);
  const [adSuccess, setAdSuccess] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [discordRoleId, setDiscordRoleId] = useState('');
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<AccountCategory>('Steam');
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkPaste, setBulkPaste] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkGames, setBulkGames] = useState('');
  const [bulkPlanDetails, setBulkPlanDetails] = useState('');
  const [bulkNetflixType, setBulkNetflixType] = useState<NetflixType>('account');
  const [bulkScreenshot, setBulkScreenshot] = useState<string | null>(null);
  const [bulkCookieFile, setBulkCookieFile] = useState<{ data: string; name: string } | null>(null);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkHref, setNewLinkHref] = useState('');
  const [vipMembers, setVipMembers] = useState<any[]>([]);
  const [vipEmail, setVipEmail] = useState('');
  const [vipDuration, setVipDuration] = useState('1_month');
  const [vipAdding, setVipAdding] = useState(false);
  const [vipError, setVipError] = useState('');
  const [vipSuccess, setVipSuccess] = useState('');
  const [adsSafeMode, setAdsSafeMode] = useState(false);
  const [adsSafeModeSaving, setAdsSafeModeSaving] = useState(false);
  const [redirectLogs, setRedirectLogs] = useState<any[]>([]);
  const [redirectLogsLoading, setRedirectLogsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAccounts().then(setAccounts);
      fetchAnnouncements();
      fetchAdSlots();
      fetchAdSafeMode();
      fetchWebhookSettings();
      fetchQuickLinks();
      fetchVipMembers();
      fetchRedirectLogs();
    }
  }, [isAdmin]);

  const fetchRedirectLogs = async () => {
    setRedirectLogsLoading(true);
    const { data } = await supabase.from('ad_redirect_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setRedirectLogs(data || []);
    setRedirectLogsLoading(false);
  };
  const handleClearRedirectLogs = async () => {
    await supabase.from('ad_redirect_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    fetchRedirectLogs();
  };

  const fetchWebhookSettings = async () => {
    const { data } = await supabase.from('site_settings').select('key, value').in('key', ['discord_webhook_url', 'discord_role_id']);
    (data || []).forEach((r: any) => { if (r.key === 'discord_webhook_url') setWebhookUrl(r.value); if (r.key === 'discord_role_id') setDiscordRoleId(r.value); });
  };

  const handleSaveWebhook = async () => {
    setWebhookSaving(true);
    const ts = new Date().toISOString();
    const upsert = async (key: string, value: string) => {
      const { data: ex } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();
      if (ex) await supabase.from('site_settings').update({ value, updated_at: ts }).eq('id', ex.id);
      else await supabase.from('site_settings').insert({ key, value, updated_at: ts });
    };
    await Promise.all([upsert('discord_webhook_url', webhookUrl.trim()), upsert('discord_role_id', discordRoleId.trim())]);
    setWebhookSuccess(true); setTimeout(() => setWebhookSuccess(false), 2000);
    setWebhookSaving(false);
  };

  const fetchQuickLinks = async () => { const { data } = await supabase.from('quick_links').select('*').order('sort_order'); if (data) setQuickLinks(data); };
  const handleAddQuickLink = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newLinkLabel.trim()) return;
    const maxOrder = quickLinks.reduce((m, l) => Math.max(m, l.sort_order), 0);
    await supabase.from('quick_links').insert({ label: newLinkLabel.trim(), href: newLinkHref.trim() || '#', sort_order: maxOrder + 1 });
    setNewLinkLabel(''); setNewLinkHref(''); fetchQuickLinks();
  };
  const handleDeleteQuickLink = async (id: string) => { await supabase.from('quick_links').delete().eq('id', id); fetchQuickLinks(); };
  const handleToggleQuickLink = async (id: string, is_active: boolean) => { await supabase.from('quick_links').update({ is_active }).eq('id', id); fetchQuickLinks(); };
  const handleMoveQuickLink = async (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1; if (j < 0 || j >= quickLinks.length) return;
    await Promise.all([supabase.from('quick_links').update({ sort_order: quickLinks[j].sort_order }).eq('id', quickLinks[i].id), supabase.from('quick_links').update({ sort_order: quickLinks[i].sort_order }).eq('id', quickLinks[j].id)]);
    fetchQuickLinks();
  };

  const VIP_DURATIONS: Record<string, { label: string; days: number }> = { '1_week': { label: '1 Week', days: 7 }, '1_month': { label: '1 Month', days: 30 }, '3_months': { label: '3 Months', days: 90 }, '1_year': { label: '1 Year', days: 365 } };

  const fetchVipMembers = async () => {
    const { data } = await supabase.from('vip_subscriptions').select('*').order('expires_at', { ascending: false });
    if (!data) { setVipMembers([]); return; }
    const ids = data.map(v => v.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', ids);
    const map = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
    setVipMembers(data.map(v => ({ ...v, display_name: map.get(v.user_id) || 'Unknown' })));
  };

  const handleGrantVip = async (e: React.FormEvent) => {
    e.preventDefault(); setVipError(''); setVipSuccess('');
    if (!vipEmail.trim()) { setVipError('Username required'); return; }
    setVipAdding(true);
    const { data: profile } = await supabase.from('profiles').select('user_id, display_name').ilike('display_name', vipEmail.trim()).maybeSingle();
    if (!profile?.user_id) { setVipError('User not found.'); setVipAdding(false); return; }
    const dur = VIP_DURATIONS[vipDuration]; const exp = new Date(); exp.setDate(exp.getDate() + dur.days);
    const { error } = await supabase.from('vip_subscriptions').upsert({ user_id: profile.user_id, plan_name: vipDuration, starts_at: new Date().toISOString(), expires_at: exp.toISOString(), granted_by: user?.id }, { onConflict: 'user_id' });
    if (error) setVipError('Failed: ' + error.message);
    else { setVipSuccess(`VIP granted to "${profile.display_name}" for ${dur.label}`); setVipEmail(''); fetchVipMembers(); }
    setVipAdding(false);
  };
  const handleRevokeVip = async (id: string) => { await supabase.from('vip_subscriptions').delete().eq('id', id); fetchVipMembers(); };

  const fetchAdSlots = async () => { const { data } = await supabase.from('ad_slots').select('*').order('slot_name'); if (data) setAdSlots(data); };
  const fetchAdSafeMode = async () => { const { data } = await supabase.from('site_settings').select('value').eq('key', 'ads_safe_mode').maybeSingle(); setAdsSafeMode(data?.value === 'true'); };

  const handleToggleAdsSafeMode = async () => {
    setAdsSafeModeSaving(true); const next = !adsSafeMode; const ts = new Date().toISOString();
    const { data: ex } = await supabase.from('site_settings').select('id').eq('key', 'ads_safe_mode').maybeSingle();
    if (ex) await supabase.from('site_settings').update({ value: String(next), updated_at: ts }).eq('id', ex.id);
    else await supabase.from('site_settings').insert({ key: 'ads_safe_mode', value: String(next), updated_at: ts });
    setAdsSafeMode(next); invalidateAdCache(); setAdsSafeModeSaving(false);
  };

  const handleSaveAd = async (id: string, code: string) => {
    setAdSaving(id); await supabase.from('ad_slots').update({ ad_code: code, updated_at: new Date().toISOString() }).eq('id', id);
    invalidateAdCache(); setAdSaving(null); setAdSuccess(id); setTimeout(() => setAdSuccess(null), 2000);
  };
  const handleToggleAd = async (id: string, active: boolean) => {
    await supabase.from('ad_slots').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
    invalidateAdCache(); fetchAdSlots();
  };

  const fetchAnnouncements = async () => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${url}/functions/v1/manage-announcements`, { headers: { 'Authorization': `Bearer ${key}` } });
      const data = await res.json(); if (Array.isArray(data)) setAnnouncements(data);
    } catch {}
  };
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault(); if (!announcementMsg.trim()) return;
    try {
      const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${url}/functions/v1/manage-announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ message: announcementMsg, link_text: announcementLinkText || null, link_url: announcementLinkUrl || null }) });
      setAnnouncementMsg(''); setAnnouncementLinkText(''); setAnnouncementLinkUrl(''); fetchAnnouncements();
    } catch {}
  };
  const handleToggleAnnouncement = async (id: string, is_active: boolean) => {
    try { const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${url}/functions/v1/manage-announcements?action=toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ id, is_active }) });
      fetchAnnouncements(); } catch {}
  };
  const handleDeleteAnnouncement = async (id: string) => {
    try { const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${url}/functions/v1/manage-announcements?action=delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ id }) });
      fetchAnnouncements(); } catch {}
  };

  // Bulk drop
  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setBulkError(''); setBulkSuccess('');
    const isBC = bulkCategory === 'Netflix' && bulkNetflixType === 'cookies';
    const lines = bulkPaste.trim().split('\n').filter(l => l.trim());
    if (!isBC && lines.length === 0) { setBulkError('Paste at least one email:password line.'); return; }
    if (!bulkTitle.trim()) { setBulkError('Title required.'); return; }
    if (isBC && !bulkCookieFile) { setBulkError('Upload cookie file.'); return; }
    setBulkAdding(true);
    if (isBC && lines.length === 0) {
      const r = await addAccount({ title: bulkTitle, category: bulkCategory, email: '', password: '', notes: bulkNotes || undefined, screenshot: bulkScreenshot || undefined, netflixType: bulkNetflixType, cookieFile: bulkCookieFile?.data, cookieFileName: bulkCookieFile?.name });
      if (r) { sendWebhook(r); setBulkSuccess('Added 1 account!'); } else setBulkError('Failed.');
    } else {
      const parsed = lines.map(l => { const p = l.split(':'); return p.length >= 2 ? { email: p[0].trim(), password: p.slice(1).join(':').trim() } : null; });
      if (parsed.some(p => !p)) { setBulkError('Invalid format.'); setBulkAdding(false); return; }
      let added = 0;
      for (let i = 0; i < parsed.length; i++) {
        const p = parsed[i]!;
        const r = await addAccount({ title: lines.length === 1 ? bulkTitle : `${bulkTitle} #${i + 1}`, category: bulkCategory, email: p.email, password: p.password, notes: bulkNotes || undefined, screenshot: bulkScreenshot || undefined, games: bulkCategory === 'Steam' ? bulkGames || undefined : undefined, planDetails: bulkCategory === 'Crunchyroll' ? bulkPlanDetails || undefined : undefined, netflixType: bulkCategory === 'Netflix' ? bulkNetflixType : undefined, cookieFile: isBC && bulkCookieFile ? bulkCookieFile.data : undefined, cookieFileName: isBC && bulkCookieFile ? bulkCookieFile.name : undefined });
        if (r) { added++; if (added === 1) sendWebhook(r); }
      }
      setBulkSuccess(`Added ${added}/${lines.length}!`);
    }
    setBulkAdding(false); setBulkPaste(''); setBulkTitle(''); setBulkNotes(''); setBulkGames(''); setBulkPlanDetails(''); setBulkScreenshot(null); setBulkCookieFile(null);
    fetchAccounts().then(setAccounts); setTimeout(() => setBulkSuccess(''), 4000);
  };

  const sendWebhook = async (a: AccountDrop) => {
    try { await supabase.functions.invoke('discord-webhook', { body: { title: a.title, category: a.category, imageUrl: a.screenshot || undefined, accountUrl: `${window.location.origin}/account/${a.slug}` } }); } catch {}
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || file.size > 5 * 1024 * 1024) return;
    const name = `${crypto.randomUUID()}.${file.name.split('.').pop() || 'png'}`;
    const { error } = await supabase.storage.from('screenshots').upload(name, file, { contentType: file.type, upsert: true });
    if (!error) { const { data } = supabase.storage.from('screenshots').getPublicUrl(name); setBulkScreenshot(data.publicUrl); }
  };

  const handleBulkCookieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader(); reader.onload = () => setBulkCookieFile({ data: reader.result as string, name: file.name }); reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => { await deleteAccount(id); fetchAccounts().then(setAccounts); };
  const handleReset = async (id: string) => { await resetClaim(id); fetchAccounts().then(setAccounts); };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const available = accounts.filter(a => !a.isClaimed).length;
  const claimed = accounts.filter(a => a.isClaimed).length;

  return (
    <div className="min-h-screen bg-background">
      <style>{`.admin-input { width: 100%; background: hsl(var(--muted)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; color: hsl(var(--foreground)); border: 1px solid hsl(var(--border)); outline: none; transition: border-color 0.2s; } .admin-input:focus { border-color: hsl(var(--primary)); } .admin-input::placeholder { color: hsl(var(--muted-foreground)); }`}</style>

      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-[11px] text-muted-foreground hover:text-foreground">View Site →</a>
            <button onClick={signOut} className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <p className="text-xl font-bold text-warning">{accounts.length}</p>
            <p className="text-[11px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <p className="text-xl font-bold text-success">{available}</p>
            <p className="text-[11px] text-muted-foreground">Available</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 text-center">
            <p className="text-xl font-bold text-primary">{claimed}</p>
            <p className="text-[11px] text-muted-foreground">Claimed</p>
          </div>
        </div>

        {/* Announcements */}
        <Section icon={<Megaphone className="w-4 h-4 text-primary" />} title="Announcements">
          <form onSubmit={handleAddAnnouncement} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="sm:col-span-2"><input type="text" value={announcementMsg} onChange={e => setAnnouncementMsg(e.target.value)} placeholder="Message..." className="admin-input" /></div>
            <input type="text" value={announcementLinkText} onChange={e => setAnnouncementLinkText(e.target.value)} placeholder="Link text" className="admin-input" />
            <input type="text" value={announcementLinkUrl} onChange={e => setAnnouncementLinkUrl(e.target.value)} placeholder="Link URL" className="admin-input" />
            <div className="sm:col-span-2"><button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</button></div>
          </form>
          {announcements.map(a => (
            <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50 mb-2">
              <span className={`flex-1 text-xs ${a.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{a.message}</span>
              <button onClick={() => handleToggleAnnouncement(a.id, !a.is_active)} className={`p-1 rounded cursor-pointer ${a.is_active ? 'text-success' : 'text-muted-foreground'}`}><Power className="w-3 h-3" /></button>
              <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </Section>

        {/* Ad Slots */}
        <Section icon={<MonitorPlay className="w-4 h-4 text-primary" />} title="Ad Slots">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 mb-4">
            <div><p className="text-xs font-semibold text-foreground">Safe Mode</p><p className="text-[10px] text-muted-foreground">Disable all ads site-wide</p></div>
            <button onClick={handleToggleAdsSafeMode} disabled={adsSafeModeSaving}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50 ${adsSafeMode ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
              {adsSafeMode ? 'ON' : 'OFF'}
            </button>
          </div>
          {adSlots.map(slot => (
            <AdSlotEditor key={slot.id} slot={slot} saving={adSaving === slot.id} saved={adSuccess === slot.id} onSave={code => handleSaveAd(slot.id, code)} onToggle={active => handleToggleAd(slot.id, active)} />
          ))}
        </Section>

        {/* Redirect Logs */}
        <Section icon={<AlertTriangle className="w-4 h-4 text-warning" />} title={`Redirect Logs (${redirectLogs.length})`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-muted-foreground">Blocked ad redirects — latest 50</p>
            <div className="flex gap-2">
              <button onClick={fetchRedirectLogs} disabled={redirectLogsLoading} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary text-secondary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-3 h-3 ${redirectLogsLoading ? 'animate-spin' : ''}`} />
              </button>
              {redirectLogs.length > 0 && (
                <button onClick={handleClearRedirectLogs} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-destructive text-destructive-foreground hover:opacity-90 cursor-pointer flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
          {redirectLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No blocked redirects 🎉</p>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {redirectLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-warning uppercase">{log.block_type}</span>
                    {log.source_slot && <span className="text-[10px] text-muted-foreground">· {log.source_slot}</span>}
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] font-mono text-foreground break-all">{log.blocked_url}</p>
                  {log.page_url && <p className="text-[10px] text-muted-foreground mt-0.5">Page: {log.page_url}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={<Webhook className="w-4 h-4 text-primary" />} title="Discord Webhook">
          <div className="space-y-2 mb-3">
            <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="Webhook URL" className="admin-input" />
            <input type="text" value={discordRoleId} onChange={e => setDiscordRoleId(e.target.value)} placeholder="Role ID" className="admin-input" />
          </div>
          <button onClick={handleSaveWebhook} disabled={webhookSaving} className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
            <Save className="w-3 h-3" /> {webhookSaving ? 'Saving...' : 'Save'}
          </button>
          {webhookSuccess && <p className="text-[11px] text-success mt-2">Saved!</p>}
        </Section>

        {/* Quick Links */}
        <Section icon={<Link2 className="w-4 h-4 text-primary" />} title="Quick Links">
          <form onSubmit={handleAddQuickLink} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <input type="text" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="Label" className="admin-input" />
            <input type="text" value={newLinkHref} onChange={e => setNewLinkHref(e.target.value)} placeholder="URL" className="admin-input" />
            <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</button>
          </form>
          {quickLinks.map((link, i) => (
            <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50 mb-2">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleMoveQuickLink(i, 'up')} disabled={i === 0} className="p-0.5 text-muted-foreground disabled:opacity-30 cursor-pointer"><ArrowUp className="w-2.5 h-2.5" /></button>
                <button onClick={() => handleMoveQuickLink(i, 'down')} disabled={i === quickLinks.length - 1} className="p-0.5 text-muted-foreground disabled:opacity-30 cursor-pointer"><ArrowDown className="w-2.5 h-2.5" /></button>
              </div>
              <span className="flex-1 text-xs text-foreground truncate">{link.label}</span>
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{link.href}</span>
              <button onClick={() => handleToggleQuickLink(link.id, !link.is_active)} className={`p-1 rounded cursor-pointer ${link.is_active ? 'text-success' : 'text-muted-foreground'}`}><Power className="w-3 h-3" /></button>
              <button onClick={() => handleDeleteQuickLink(link.id)} className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </Section>

        {/* VIP */}
        <Section icon={<Crown className="w-4 h-4 text-warning" />} title="VIP Management">
          <form onSubmit={handleGrantVip} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <input type="text" value={vipEmail} onChange={e => setVipEmail(e.target.value)} placeholder="Username" className="admin-input" />
            <select value={vipDuration} onChange={e => setVipDuration(e.target.value)} className="admin-input cursor-pointer">
              <option value="1_week">1 Week</option><option value="1_month">1 Month</option><option value="3_months">3 Months</option><option value="1_year">1 Year</option>
            </select>
            <button type="submit" disabled={vipAdding} className="px-4 py-2 rounded-lg text-xs font-semibold bg-warning text-background hover:opacity-90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
              <Crown className="w-3.5 h-3.5" /> {vipAdding ? '...' : 'Grant'}
            </button>
          </form>
          {vipError && <p className="text-destructive text-[11px] mb-2">{vipError}</p>}
          {vipSuccess && <p className="text-success text-[11px] mb-2">{vipSuccess}</p>}
          {vipMembers.map(v => (
            <div key={v.id} className={`flex items-center gap-2 p-2.5 rounded-lg border mb-2 ${new Date(v.expires_at) < new Date() ? 'bg-muted/30 border-border/50' : 'bg-warning/5 border-warning/20'}`}>
              <Crown className={`w-3.5 h-3.5 shrink-0 ${new Date(v.expires_at) < new Date() ? 'text-muted-foreground' : 'text-warning'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{v.display_name}</p>
                <p className="text-[10px] text-muted-foreground">{VIP_DURATIONS[v.plan_name]?.label || v.plan_name} · Expires {new Date(v.expires_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleRevokeVip(v.id)} className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </Section>

        {/* Drop Accounts */}
        <Section icon={<Plus className="w-4 h-4 text-primary" />} title="Drop Accounts">
          <AccountDropForm onAccountAdded={() => fetchAccounts().then(setAccounts)} userId={user?.id} />
        </Section>

        {/* Manage */}
        <Section icon={<RefreshCw className="w-4 h-4 text-primary" />} title={`Manage (${accounts.length})`}>
          {accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No drops yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/30">
                  <span className="text-sm">{CATEGORY_COLORS[a.category]?.icon || '🎁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${a.isClaimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{a.category} · {a.isClaimed ? 'Claimed' : 'Available'}</p>
                  </div>
                  {a.isClaimed && <button onClick={() => handleReset(a.id)} className="p-1 rounded text-muted-foreground hover:text-primary cursor-pointer"><RotateCcw className="w-3 h-3" /></button>}
                  <button onClick={() => handleDelete(a.id)} className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </div>
  );
}

function AdSlotEditor({ slot, saving, saved, onSave, onToggle }: { slot: any; saving: boolean; saved: boolean; onSave: (code: string) => void; onToggle: (active: boolean) => void }) {
  const [code, setCode] = useState(slot.ad_code || '');
  return (
    <div className={`p-3 rounded-lg border mb-3 ${slot.is_active ? 'border-border bg-muted/30' : 'border-border/50 bg-muted/10 opacity-60'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{slot.slot_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[10px] text-success">Saved</span>}
          <button onClick={() => onToggle(!slot.is_active)} className={`p-1 rounded cursor-pointer ${slot.is_active ? 'text-success' : 'text-muted-foreground'}`}><Power className="w-3 h-3" /></button>
        </div>
      </div>
      <textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Paste ad code..." rows={3} className="w-full bg-background rounded-lg px-2.5 py-2 text-[11px] font-mono text-foreground border border-border focus:border-primary outline-none resize-y mb-2" />
      <button onClick={() => onSave(code)} disabled={saving} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-1 disabled:opacity-50">
        <Save className="w-3 h-3" /> {saving ? '...' : 'Save'}
      </button>
    </div>
  );
}
