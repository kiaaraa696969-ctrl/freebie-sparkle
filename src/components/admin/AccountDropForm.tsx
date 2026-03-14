import { useState } from 'react';
import { Plus, Trash2, ImagePlus, X, FileArchive, ChevronDown, ChevronUp } from 'lucide-react';
import { AccountCategory, NetflixType, CATEGORY_COLORS, addAccount, addSubAccounts } from '@/lib/accounts';
import { supabase } from '@/integrations/supabase/client';

interface SubAccountEntry {
  label: string;
  email: string;
  password: string;
  games: string;
  notes: string;
}

interface AccountDropFormProps {
  onAccountAdded: () => void;
  userId?: string;
}

export function AccountDropForm({ onAccountAdded, userId }: AccountDropFormProps) {
  const [form, setForm] = useState({
    title: '', category: 'Steam' as AccountCategory, email: '', password: '',
    notes: '', games: '', netflixType: 'account' as NetflixType, planDetails: '',
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [cookieFile, setCookieFile] = useState<{ data: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [subAccounts, setSubAccounts] = useState<SubAccountEntry[]>([
    { label: '', email: '', password: '', games: '', notes: '' },
    { label: '', email: '', password: '', games: '', notes: '' },
  ]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setError('');
    const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop() || 'png'}`;
    const { error: uploadError } = await supabase.storage.from('screenshots').upload(fileName, file, { contentType: file.type, upsert: true });
    if (uploadError) { setError('Upload failed: ' + uploadError.message); return; }
    const { data } = supabase.storage.from('screenshots').getPublicUrl(fileName);
    setScreenshot(data.publicUrl);
  };

  const handleCookieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setCookieFile({ data: reader.result as string, name: file.name });
    reader.readAsDataURL(file);
  };

  const addSubAccount = () => {
    setSubAccounts(prev => [...prev, { label: '', email: '', password: '', games: '', notes: '' }]);
  };

  const removeSubAccount = (index: number) => {
    if (subAccounts.length <= 1) return;
    setSubAccounts(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubAccount = (index: number, field: keyof SubAccountEntry, value: string) => {
    setSubAccounts(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNetflixCookies = form.category === 'Netflix' && form.netflixType === 'cookies';
    if (!form.title) { setError('Title is required.'); return; }

    if (isMultiMode) {
      const validSubs = subAccounts.filter(s => s.email && s.password);
      if (validSubs.length === 0) { setError('Add at least one account with email and password.'); return; }

      // Create parent account with empty credentials
      const result = await addAccount({
        ...form,
        email: 'multi-account',
        password: 'multi-account',
        screenshot: screenshot || undefined,
        games: undefined,
        netflixType: undefined,
        cookieFile: undefined,
        cookieFileName: undefined,
        planDetails: form.category === 'Crunchyroll' ? form.planDetails || undefined : undefined,
      });

      if (!result) { setError('Failed to drop account.'); return; }

      // Add sub accounts
      await addSubAccounts(result.id, validSubs.map((s, i) => ({
        label: s.label || `${form.category} ${i + 1}`,
        email: s.email,
        password: s.password,
        games: form.category === 'Steam' && s.games ? s.games : undefined,
        notes: s.notes || undefined,
        sortOrder: i,
      })));

      // Discord webhook
      try {
        const accountUrl = `${window.location.origin}/account/${result.slug}`;
        await supabase.functions.invoke('discord-webhook', {
          body: { title: `${result.title} (${validSubs.length} accounts)`, category: result.category, imageUrl: screenshot || undefined, accountUrl },
        });
      } catch {}

    } else {
      if (!isNetflixCookies && (!form.email || !form.password)) { setError('Email and password are required.'); return; }
      if (isNetflixCookies && !cookieFile) { setError('Please upload a cookie file.'); return; }

      const result = await addAccount({
        ...form,
        email: isNetflixCookies ? '' : form.email,
        password: isNetflixCookies ? '' : form.password,
        screenshot: screenshot || undefined,
        games: form.category === 'Steam' ? form.games || undefined : undefined,
        netflixType: form.category === 'Netflix' ? form.netflixType : undefined,
        cookieFile: isNetflixCookies && cookieFile ? cookieFile.data : undefined,
        cookieFileName: isNetflixCookies && cookieFile ? cookieFile.name : undefined,
        planDetails: form.category === 'Crunchyroll' ? form.planDetails || undefined : undefined,
      });

      if (!result) { setError('Failed to drop account.'); return; }

      try {
        const accountUrl = `${window.location.origin}/account/${result.slug}`;
        await supabase.functions.invoke('discord-webhook', {
          body: { title: result.title, category: result.category, imageUrl: screenshot || undefined, accountUrl },
        });
      } catch {}
    }

    setForm({ title: '', category: 'Steam', email: '', password: '', notes: '', games: '', netflixType: 'account', planDetails: '' });
    setScreenshot(null); setCookieFile(null); setError('');
    setSubAccounts([{ label: '', email: '', password: '', games: '', notes: '' }, { label: '', email: '', password: '', games: '', notes: '' }]);
    setSuccess('Account dropped!');
    setTimeout(() => setSuccess(''), 3000);
    onAccountAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[11px] text-muted-foreground block mb-1">Title *</label>
          <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Steam Account with GTA V" className="admin-input" />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as AccountCategory })} className="admin-input cursor-pointer">
            {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={() => setIsMultiMode(!isMultiMode)}
            className={`w-full px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isMultiMode
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
            }`}>
            {isMultiMode ? '✓ Multi-Account Mode' : 'Switch to Multi-Account'}
          </button>
        </div>
      </div>

      {!isMultiMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {form.category === 'Netflix' && (
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Netflix Type</label>
              <select value={form.netflixType} onChange={e => setForm({ ...form, netflixType: e.target.value as NetflixType })} className="admin-input cursor-pointer">
                <option value="account">Account (Email/Pass)</option>
                <option value="cookies">Cookies (.rar file)</option>
              </select>
            </div>
          )}
          {!(form.category === 'Netflix' && form.netflixType === 'cookies') && (
            <>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Email *</label>
                <input type="text" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="account@email.com" className="admin-input" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Password *</label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="password" className="admin-input" />
              </div>
            </>
          )}
          {form.category === 'Netflix' && form.netflixType === 'cookies' && (
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted-foreground block mb-1">Cookie File *</label>
              <input type="file" accept=".rar,.zip,.7z" onChange={handleCookieFileChange} className="hidden" id="cookie-single" />
              {cookieFile ? (
                <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border">
                  <FileArchive className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-foreground flex-1">{cookieFile.name}</span>
                  <button type="button" onClick={() => setCookieFile(null)} className="text-muted-foreground hover:text-destructive cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                </div>
              ) : (
                <label htmlFor="cookie-single" className="w-full p-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary cursor-pointer flex items-center justify-center gap-2">
                  <FileArchive className="w-3.5 h-3.5" /> Upload cookie file
                </label>
              )}
            </div>
          )}
          {form.category === 'Steam' && (
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted-foreground block mb-1">Games</label>
              <input type="text" value={form.games} onChange={e => setForm({ ...form, games: e.target.value })} placeholder="GTA V, CS2, Rust" className="admin-input" />
            </div>
          )}
          {form.category === 'Crunchyroll' && (
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted-foreground block mb-1">Plan Details</label>
              <input type="text" value={form.planDetails} onChange={e => setForm({ ...form, planDetails: e.target.value })} placeholder="e.g. Mega Fan" className="admin-input" />
            </div>
          )}
        </div>
      )}

      {isMultiMode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{subAccounts.length} Accounts</span>
            <button type="button" onClick={addSubAccount}
              className="text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Account
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
            {subAccounts.map((sub, i) => (
              <div key={i} className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">#{i + 1}</span>
                  <button type="button" onClick={() => removeSubAccount(i)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" value={sub.label} onChange={e => updateSubAccount(i, 'label', e.target.value)}
                    placeholder={`Label (e.g. ${form.category} ${i + 1})`} className="admin-input text-xs" />
                  <input type="text" value={sub.email} onChange={e => updateSubAccount(i, 'email', e.target.value)}
                    placeholder="Email *" className="admin-input text-xs" />
                  <input type="text" value={sub.password} onChange={e => updateSubAccount(i, 'password', e.target.value)}
                    placeholder="Password *" className="admin-input text-xs" />
                </div>
                {form.category === 'Steam' && (
                  <input type="text" value={sub.games} onChange={e => updateSubAccount(i, 'games', e.target.value)}
                    placeholder="Games (GTA V, CS2...)" className="admin-input text-xs" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[11px] text-muted-foreground block mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Extra info..." className="admin-input resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] text-muted-foreground block mb-1">Screenshot</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="ss-single" />
          {screenshot ? (
            <div className="relative inline-block">
              <img src={screenshot} alt="Preview" className="w-28 h-16 object-cover rounded-lg border border-border" />
              <button type="button" onClick={() => setScreenshot(null)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] cursor-pointer"><X className="w-2.5 h-2.5" /></button>
            </div>
          ) : (
            <label htmlFor="ss-single" className="w-full p-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary cursor-pointer flex items-center justify-center gap-2">
              <ImagePlus className="w-3.5 h-3.5" /> Upload
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
      {success && <p className="text-success text-xs">{success}</p>}
      <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold text-xs bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-2">
        <Plus className="w-3.5 h-3.5" /> {isMultiMode ? `Drop ${subAccounts.filter(s => s.email && s.password).length} Accounts` : 'Drop Account'}
      </button>
    </form>
  );
}
