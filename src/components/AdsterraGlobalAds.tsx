import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loadAds } from '@/components/AdSlot';
import { supabase } from '@/integrations/supabase/client';

/**
 * Injects Adsterra global ad formats (Social Bar, Popunder) as <script> tags.
 * Managed via ad_slots table with slot names: "social_bar" and "popunder".
 * Hidden for VIP users.
 */
export function AdsterraGlobalAds() {
  const { isVip, loading } = useAuth();
  const injectedRef = useRef(false);

  useEffect(() => {
    // Wait until auth loading is complete before deciding
    if (loading) return;

    // If VIP, remove any previously injected scripts and bail
    if (isVip) {
      document.querySelectorAll('script[data-ad-slot="social_bar"], script[data-ad-slot="popunder"]').forEach((el) => el.remove());
      injectedRef.current = false;
      return;
    }

    if (injectedRef.current) return;
    injectedRef.current = true;

    (async () => {
      const { data: slots } = await supabase
        .from('ad_slots')
        .select('slot_name, ad_code')
        .eq('is_active', true)
        .in('slot_name', ['social_bar', 'popunder']);

      if (!slots || slots.length === 0) return;

      for (const slot of slots) {
        if (!slot.ad_code?.trim()) continue;

        const temp = document.createElement('div');
        temp.innerHTML = slot.ad_code;

        const scripts = temp.querySelectorAll('script');
        scripts.forEach((origScript) => {
          const script = document.createElement('script');
          Array.from(origScript.attributes).forEach((attr) => {
            script.setAttribute(attr.name, attr.value);
          });
          if (origScript.textContent) {
            script.textContent = origScript.textContent;
          }
          script.dataset.adSlot = slot.slot_name;
          document.body.appendChild(script);
        });
      }
    })();

    return () => {
      document.querySelectorAll('script[data-ad-slot="social_bar"], script[data-ad-slot="popunder"]').forEach((el) => el.remove());
      injectedRef.current = false;
    };
  }, [isVip, loading]);

  return null;
}
