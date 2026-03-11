import { useState } from 'react';
import { Plus, ImagePlus, X, FileArchive } from 'lucide-react';
import { AccountCategory, NetflixType, CATEGORY_COLORS, addAccount } from '@/lib/accounts';
import { supabase } from '@/integrations/supabase/client';

interface AccountDropFormProps {
  onAccountAdded: () => void;
  userId?: string;
}

/**
 * Parses a line like:
 * email:password | Key = Value | Key = Value ...
 * Returns { email, password, metadata: Record<string, string> }
 */
function parseLine(line: string): { email: string; password: string; metadata: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Split by first occurrence of | to get credentials part vs metadata
  const pipeIdx = trimmed.indexOf('|');
  let credPart: string;
  let metaPart = '';

  if (pipeIdx !== -1) {
    credPart = trimmed.slice(0, pipeIdx).trim();
    metaPart = trimmed.slice(pipeIdx).trim(); // keep all metadata with | separators
  } else {
    credPart = trimmed;
  }

  // Parse email:password (split on first colon only)
  const colonIdx = credPart.indexOf(':');
  if (colonIdx === -1) return null;

  const email = credPart.slice(0, colonIdx).trim();
  const password = credPart.slice(colonIdx + 1).trim();
  if (!email || !password) return null;

  return { email, password, metadata: metaPart };
}

/**
 * Extract plan info from metadata string
 */
function extractPlanFromMeta(meta: string): string {
  const planMatch = meta.match(/Plan\s*=\s*([^|]+)/i);
  return planMatch ? planMatch[1].trim() : '';
}

export function AccountDropForm({ onAccountAdded, userId }: AccountDropFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AccountCategory>('Steam');
  const [netflixType, setNetflixType] = useState<NetflixType>('account');
  const [paste, setPaste] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [cookieFile, setCookieFile] = useState<{ data: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!title.trim()) { setError('Title required.'); return; }

    const isNetflixCookies = category === 'Netflix' && netflixType === 'cookies';

    // For cookie mode without paste text
    if (isNetflixCookies && !paste.trim()) {
      if (!cookieFile) { setError('Upload cookie file.'); return; }
      setAdding(true);
      const r = await addAccount({
        title, category, email: '', password: '',
        notes: notes || undefined, screenshot: screenshot || undefined,
        netflixType, cookieFile: cookieFile.data, cookieFileName: cookieFile.name,
      });
      if (r) {
        sendWebhook(r);
        setSuccess('Added 1 account!');
      } else setError('Failed.');
      setAdding(false);
      resetForm();
      onAccountAdded();
      return;
    }

    const lines = paste.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) { setError('Paste at least one username/email:password line.'); return; }

    const parsed = lines.map(parseLine);
    if (parsed.some(p => !p)) { setError('Invalid format. Each line must be username/email:password (optionally followed by | metadata).'); setAdding(false); return; }

    setAdding(true);
    let added = 0;
    for (let i = 0; i < parsed.length; i++) {
      const p = parsed[i]!;
      // Build notes: combine metadata + user notes
      const allNotes = [p.metadata, notes].filter(Boolean).join('\n');
      const planDetails = extractPlanFromMeta(p.metadata);

      const r = await addAccount({
        title: lines.length === 1 ? title : `${title} #${i + 1}`,
        category,
        email: p.email,
        password: p.password,
        notes: allNotes || undefined,
        screenshot: screenshot || undefined,
        games: undefined,
        planDetails: planDetails || undefined,
        netflixType: category === 'Netflix' ? netflixType : undefined,
        cookieFile: isNetflixCookies && cookieFile ? cookieFile.data : undefined,
        cookieFileName: isNetflixCookies && cookieFile ? cookieFile.name : undefined,
      });
      if (r) { added++; if (added === 1) sendWebhook(r); }
    }
    setSuccess(`Added ${added}/${lines.length} account${lines.length > 1 ? 's' : ''}!`);
    setAdding(false);
    resetForm();
    onAccountAdded();
    setTimeout(() => setSuccess(''), 4000);
  };

  const sendWebhook = async (a: any) => {
    try {
      await supabase.functions.invoke('discord-webhook', {
        body: { title: a.title, category: a.category, imageUrl: a.screenshot || undefined, accountUrl: `${window.location.origin}/account/${a.slug}` },
      });
    } catch {}
  };

  const resetForm = () => {
    setPaste(''); setTitle(''); setNotes(''); setScreenshot(null); setCookieFile(null);
  };

  const lineCount = paste.trim().split('\n').filter(l => l.trim()).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[11px] text-muted-foreground block mb-1">Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Crunchyroll Premium Accounts" className="admin-input" />
          <p className="text-[10px] text-muted-foreground mt-1">For multiple accounts, each gets "#1", "#2" etc. appended</p>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as AccountCategory)} className="admin-input cursor-pointer">
            {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {category === 'Netflix' && (
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Netflix Type</label>
            <select value={netflixType} onChange={e => setNetflixType(e.target.value as NetflixType)} className="admin-input cursor-pointer">
              <option value="account">Account</option>
              <option value="cookies">Cookies</option>
            </select>
          </div>
        )}
      </div>

      {/* Main paste area */}
      {!(category === 'Netflix' && netflixType === 'cookies' && !paste.trim()) && (
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">
            Accounts — one per line {lineCount > 0 && <span className="text-primary font-semibold">({lineCount} account{lineCount > 1 ? 's' : ''})</span>}
          </label>
          <textarea
            value={paste}
            onChange={e => setPaste(e.target.value)}
            placeholder={`Paste accounts, one per line. Supports:\n\nemail:password\nuser:pass | Plan = Premium | Country = US 🇺🇸\nemail@test.com:pass123 | EmailVerified = Yes ✔️ | Plan = ⟪MEGA FAN⟫ | RenewAt = 2026-03-22`}
            rows={8}
            className="admin-input resize-y font-mono text-xs leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Format: <code className="bg-muted px-1 rounded">username/email:password</code> optionally followed by <code className="bg-muted px-1 rounded">| Key = Value | Key = Value</code> — metadata is saved as notes automatically
          </p>
        </div>
      )}

      {/* Cookie file for Netflix cookies */}
      {category === 'Netflix' && netflixType === 'cookies' && (
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Cookie File</label>
          <input type="file" accept=".rar,.zip,.7z" onChange={handleCookieFileChange} className="hidden" id="drop-cookie" />
          {cookieFile ? (
            <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border">
              <FileArchive className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs flex-1">{cookieFile.name}</span>
              <button type="button" onClick={() => setCookieFile(null)} className="text-muted-foreground hover:text-destructive cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <label htmlFor="drop-cookie" className="w-full p-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary cursor-pointer flex items-center justify-center gap-2">
              <FileArchive className="w-3.5 h-3.5" /> Upload cookie file
            </label>
          )}
        </div>
      )}

      {/* Extra notes & screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[11px] text-muted-foreground block mb-1">Extra Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional info for all accounts..." className="admin-input resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] text-muted-foreground block mb-1">Screenshot</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="drop-ss" />
          {screenshot ? (
            <div className="relative inline-block">
              <img src={screenshot} alt="Preview" className="w-28 h-16 object-cover rounded-lg border border-border" />
              <button type="button" onClick={() => setScreenshot(null)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center cursor-pointer"><X className="w-2.5 h-2.5" /></button>
            </div>
          ) : (
            <label htmlFor="drop-ss" className="w-full p-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary cursor-pointer flex items-center justify-center gap-2">
              <ImagePlus className="w-3.5 h-3.5" /> Upload
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
      {success && <p className="text-success text-xs">{success}</p>}
      <button type="submit" disabled={adding} className="px-5 py-2.5 rounded-lg font-semibold text-xs bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-2 disabled:opacity-50">
        <Plus className="w-3.5 h-3.5" /> {adding ? 'Adding...' : lineCount > 1 ? `Drop ${lineCount} Accounts` : 'Drop Account'}
      </button>
    </form>
  );
}
