import React from 'react';
import { Link } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';

type PageTopBarProps = {
  statusBarHeightClassName?: string;
  className?: string;
  rightSlot?: React.ReactNode;
};

const LogoButton = () => (
  <Link to="/" aria-label="На главный экран">
    <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />
  </Link>
);

export const PageTopBar = ({
  statusBarHeightClassName = 'h-12',
  className = '',
  rightSlot,
}: PageTopBarProps) => (
  <div className={`w-full bg-white ${className}`}>
    <div className={`${statusBarHeightClassName} w-full bg-[#D9D9D9]`} aria-hidden />
    <header className="flex items-center justify-between px-4 py-6">
      <LogoButton />
      <div className="min-w-[48px] text-right">{rightSlot}</div>
    </header>
  </div>
);
