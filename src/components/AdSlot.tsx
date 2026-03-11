import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdSlotProps {
  slotName: string;
  fallbackHeight?: string;
  className?: string;
}

let adCache: Record<string, string> | null = null;
let adCachePromise: Promise<void> | null = null;
let adsSafeMode = false;

// Batched redirect log queue
let logQueue: Array<{ blocked_url: string; source_slot: string; block_type: string; page_url: string; user_agent: string }> = [];
let logTimer: ReturnType<typeof setTimeout> | null = null;

function flushRedirectLogs() {
  if (logQueue.length === 0) return;
  const batch = logQueue.splice(0);
  supabase.from('ad_redirect_logs').insert(batch).then(() => {});
}

function queueRedirectLog(url: string, slot: string, type: string) {
  logQueue.push({
    blocked_url: url,
    source_slot: slot,
    block_type: type,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  });
  if (!logTimer) logTimer = setTimeout(() => { logTimer = null; flushRedirectLogs(); }, 3000);
}

// Listen for redirect attempts posted from ad iframes
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'ad-redirect-blocked') {
      queueRedirectLog(e.data.url || 'unknown', e.data.slot || 'unknown', e.data.blockType || 'iframe-intercept');
    }
  });
}

const SLOT_CONFIG: Record<string, { height: number; width: number; eager: boolean; responsive: boolean }> = {
  hero_below:     { height: 90,  width: 728, eager: true,  responsive: true },
  feed_between:   { height: 60,  width: 468, eager: false, responsive: true },
  footer_above:   { height: 90,  width: 728, eager: false, responsive: true },
  detail_top:     { height: 90,  width: 728, eager: true,  responsive: true },
  detail_mid:     { height: 250, width: 300, eager: false, responsive: true },
  detail_bottom:  { height: 250, width: 300, eager: false, responsive: true },
  detail_left:    { height: 600, width: 160, eager: true,  responsive: false },
  detail_right:   { height: 600, width: 160, eager: true,  responsive: false },
  sidebar_top:    { height: 250, width: 300, eager: false, responsive: false },
  sidebar_middle: { height: 300, width: 300, eager: false, responsive: false },
  sidebar_bottom: { height: 250, width: 300, eager: false, responsive: false },
  mobile_sticky:  { height: 50,  width: 320, eager: true,  responsive: true },
};

export async function loadAds() {
  if (adCache) return;
  if (adCachePromise) { await adCachePromise; return; }

  adCachePromise = (async () => {
    try {
      const [{ data: slots, error }, { data: safeModeRow }] = await Promise.all([
        supabase.from('ad_slots').select('slot_name, ad_code').eq('is_active', true),
        supabase.from('site_settings').select('value').eq('key', 'ads_safe_mode').maybeSingle(),
      ]);
      adsSafeMode = safeModeRow?.value === 'true';
      if (adsSafeMode || error) { adCache = {}; return; }
      adCache = {};
      (slots || []).forEach((row: any) => { adCache![row.slot_name] = row.ad_code; });
    } catch {
      adCache = {};
    }
  })();
  await adCachePromise;
}

export function invalidateAdCache() {
  adCache = null;
  adCachePromise = null;
}

export function AdSlot({ slotName, fallbackHeight = 'h-[250px]', className = '' }: AdSlotProps) {
  const { isVip } = useAuth();
  const [adCode, setAdCode] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  const config = SLOT_CONFIG[slotName] || { height: 250, width: 300, eager: false, responsive: true };

  useEffect(() => {
    if (adsSafeMode) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      await loadAds();
      if (!cancelled) {
        setAdCode(adCache?.[slotName] || '');
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [slotName]);

  useEffect(() => {
    if (config.eager) { setIsVisible(true); return; }
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaded, config.eager]);

  const injectAd = useCallback(() => {
    if (injected.current || !containerRef.current || !adCode) return;
    injected.current = true;
    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.cssText = `width:100%;border:none;overflow:hidden;display:block;min-height:${config.height}px;`;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');
    container.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const interceptScript = `
<script>
(function(){
  var slot = "${slotName}";
  var origAssign = location.assign;
  var origReplace = location.replace;
  var desc = Object.getOwnPropertyDescriptor(window, 'location') || {};
  
  function block(url, type) {
    try { parent.postMessage({ type: 'ad-redirect-blocked', url: String(url), slot: slot, blockType: type }, '*'); } catch(e) {}
  }
  
  location.assign = function(u) { block(u, 'assign'); };
  location.replace = function(u) { block(u, 'replace'); };
  
  try {
    Object.defineProperty(window, 'location', {
      get: function() { return document.location; },
      set: function(v) { block(v, 'location-set'); }
    });
  } catch(e) {}
})();
</script>`;

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;display:flex;justify-content:center;align-items:center;min-height:${config.height}px;}</style>${interceptScript}</head><body>${adCode}</body></html>`);
    doc.close();

    const ro = new ResizeObserver(() => {
      try { iframe.style.height = `${Math.max(doc.body?.scrollHeight || config.height, config.height)}px`; } catch {}
    });
    try { if (doc.body) ro.observe(doc.body); } catch {}
  }, [adCode, config.height]);

  useEffect(() => {
    if (isVisible && loaded && adCode) injectAd();
  }, [isVisible, loaded, adCode, injectAd]);

  if (isVip || adsSafeMode) return null;

  if (loaded && (!adCode || adCode.trim() === '')) {
    return (
      <div className={`${fallbackHeight} bg-muted/30 border border-border/50 border-dashed rounded-xl flex flex-col items-center justify-center ${className}`}>
        <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">Ad</span>
      </div>
    );
  }

  if (!loaded) {
    return <div ref={containerRef} className={`rounded-xl bg-muted/20 ${className}`} style={{ minHeight: config.height }} />;
  }

  return (
    <div
      ref={containerRef}
      className={`ad-slot w-full overflow-hidden ${className}`}
      data-slot={slotName}
      style={{ minHeight: config.height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    />
  );
}
