import type { ReactNode } from 'react';

type PageBlockProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export const PageBlock = ({ title, children, className = '' }: PageBlockProps) => (
  <section className={`w-full rounded-3xl bg-[#F2F2F6] px-4 py-4 ${className}`}>
    {title ? <h2 className="text-[18px] font-bold leading-[1.2] text-[#29292B]">{title}</h2> : null}
    <div className={title ? 'mt-3' : ''}>{children}</div>
  </section>
);
