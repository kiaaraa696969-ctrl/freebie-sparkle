import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  message: string;
  link_text: string | null;
  link_url: string | null;
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('dismissed_announcements');
    if (stored) setDismissed(JSON.parse(stored));

    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAnnouncement(data[0] as unknown as Announcement);
        }
      });
  }, []);

  if (!announcement || dismissed.includes(announcement.id)) return null;

  const handleDismiss = () => {
    const updated = [...dismissed, announcement.id];
    setDismissed(updated);
    sessionStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-center gap-3 text-sm relative">
        <Megaphone className="w-4 h-4 shrink-0" />
        <span className="font-medium">{announcement.message}</span>
        {announcement.link_text && announcement.link_url && (
          <a
            href={announcement.link_url}
            target="_blank"
            rel="noopener noreferrer"
            data-allow-external="true"
            className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
          >
            {announcement.link_text}
          </a>
        )}
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 rounded hover:bg-primary-foreground/20 transition-colors cursor-pointer"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
