import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'dark' | 'light';
}

export const Badge = ({ children, variant = 'dark' }: Props) => (
  <span
    className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
      variant === 'dark'
        ? 'bg-brace-black text-white'
        : 'bg-white text-brace-black border border-brace-surface'
    }`}
  >
    {children}
  </span>
);
