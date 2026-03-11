import { ReactNode } from 'react';
import { AdSlot } from '@/components/AdSlot';

interface StickyDetailLayoutProps {
  children: ReactNode;
}

export function StickyDetailLayout({ children }: StickyDetailLayoutProps) {
  return (
    <div className="flex justify-center gap-4">
      {/* Left sticky ad - hidden on mobile/tablet */}
      <div className="hidden xl:block w-[160px] shrink-0">
        <div className="sticky top-20">
          <AdSlot slotName="detail_left" fallbackHeight="h-[600px]" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-3xl">
        {children}
      </div>

      {/* Right sticky ad - hidden on mobile/tablet */}
      <div className="hidden xl:block w-[160px] shrink-0">
        <div className="sticky top-20">
          <AdSlot slotName="detail_right" fallbackHeight="h-[600px]" />
        </div>
      </div>
    </div>
  );
}
