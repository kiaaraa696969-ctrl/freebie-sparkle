import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, Loader2, Check, Shield, AlertCircle, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, loading, isAdmin, isVip, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '');
          setAvatarUrl(data.avatar_url || null);
        }
        setLoadingProfile(false);
      });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const validateUsername = (name: string) => {
    if (!name.trim()) { setUsernameError(''); return; }
    if (name.length < 3) { setUsernameError('Must be at least 3 characters'); return; }
    if (name.length > 30) { setUsernameError('Must be under 30 characters'); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) { setUsernameError('Only letters, numbers, _ . - allowed'); return; }

    setCheckingUsername(true);
    clearTimeout(usernameTimeout.current);
    usernameTimeout.current = setTimeout(async () => {
      const { data } = await supabase.rpc('is_username_available', { username: name });
      // Also check if it's the user's current name
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user!.id)
        .single();

      const isSameAsOwn = currentProfile?.display_name?.toLowerCase() === name.toLowerCase();
      if (!data && !isSameAsOwn) {
        setUsernameError('Username already taken');
      } else {
        setUsernameError('');
      }
      setCheckingUsername(false);
    }, 400);
  };

  const handleUsernameChange = (value: string) => {
    setDisplayName(value);
    validateUsername(value);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be under 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id);

    setAvatarUrl(urlWithCacheBust);
    setUploading(false);
    refreshProfile();
    toast({ title: 'Avatar updated!' });
  };

  const handleSave = async () => {
    if (usernameError || checkingUsername) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('user_id', user.id);

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast({ title: 'Username already taken', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      }
    } else {
      refreshProfile();
      toast({ title: 'Profile saved!' });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-2">Customize your account</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          {loadingProfile ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="relative w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden group cursor-pointer hover:border-primary transition-colors"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                  <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-background animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-background" />
                    )}
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">Click to change avatar</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
                {isVip && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    VIP
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Username</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="Enter a unique username"
                  maxLength={30}
                  className={`w-full bg-muted rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border transition-colors ${usernameError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
                />
                {checkingUsername && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                  </p>
                )}
                {usernameError && !checkingUsername && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {usernameError}
                  </p>
                )}
                {displayName.length >= 3 && !usernameError && !checkingUsername && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Username available
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
                <input
                  type="text"
                  value={user.email || ''}
                  readOnly
                  className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground outline-none border border-border cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !!usernameError || checkingUsername}
                className="w-full py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Back to drops
          </a>
        </div>
      </div>
    </div>
  );
}
