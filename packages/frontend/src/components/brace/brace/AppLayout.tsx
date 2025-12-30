import type { ReactNode } from 'react';

import { TabBar } from '@/widgets/navigation/TabBar';

type Props = {
  children: ReactNode;
};

/**
 * Wraps every page with the root background, container width from the design system and safe padding for the TabBar.
 */
export const AppLayout = ({ children }: Props) => (
  <div className="min-h-screen bg-[var(--color-background)] font-montserrat text-[var(--color-text)]">
    <div className="mx-auto flex min-h-screen w-full max-w-brace-container flex-col px-4 pb-28 pt-6 sm:px-8 lg:px-0">
      {children}
    </div>
    <TabBar />
  </div>
);
