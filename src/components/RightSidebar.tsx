import { useState, useEffect } from 'react';
import { AccountDrop, CATEGORY_COLORS } from '@/lib/accounts';
import { supabase } from '@/integrations/supabase/client';

import { Flame, ExternalLink } from 'lucide-react';
import { AdSlot } from '@/components/AdSlot';

interface RightSidebarProps {
  accounts: AccountDrop[];
}

export function RightSidebar({ accounts }: RightSidebarProps) {
  const [quickLinks, setQuickLinks] = useState<{ id: string; label: string; href: string }[]>([]);

  useEffect(() => {
    supabase
      .from('quick_links')
      .select('id, label, href')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setQuickLinks(data);
      });
  }, []);

  const popular = [...accounts]
    .filter(a => !a.isClaimed)
    .sort((a, b) => new Date(b.droppedAt).getTime() - new Date(a.droppedAt).getTime())
    .slice(0, 5);

  return (
    <aside className="w-full space-y-5">
      <AdSlot slotName="sidebar_top" fallbackHeight="h-[250px]" />

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Flame className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-bold text-foreground">Most Popular</h3>
        </div>
        <div className="divide-y divide-border">
          {popular.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No drops available</p>
          ) : (
            popular.map((account, i) => {
              const { color, icon } = CATEGORY_COLORS[account.category];
              const thumb = account.screenshot || account.thumbnail;
              return (
                <a
                  key={account.id}
                  href={`/account/${account.slug}`}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {thumb ? (
                      <img src={thumb} alt={account.title} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {icon}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {account.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.category}</p>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>

      <AdSlot slotName="sidebar_middle" fallbackHeight="h-[300px]" />

      {quickLinks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Quick Links</h3>
          <div className="space-y-2">
            {quickLinks.map(link => (
              <a
                key={link.id}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                data-allow-external="true"
                className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 group"
              >
                <span>{link.label}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      <AdSlot slotName="sidebar_bottom" fallbackHeight="h-[200px]" />
    </aside>
  );
}
