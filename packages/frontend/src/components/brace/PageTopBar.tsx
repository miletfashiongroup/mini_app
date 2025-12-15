import React from 'react';
import { useNavigate } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';

type PageTopBarProps = {
  statusBarHeightClassName?: string;
  className?: string;
  rightSlot?: React.ReactNode;
};

const LogoButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="На главный экран"
      onClick={() => navigate('/')}
      className="flex items-center"
    >
      <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />
    </button>
  );
};

export const PageTopBar = ({
  statusBarHeightClassName = 'h-12',
  className = '',
  rightSlot,
}: PageTopBarProps) => (
  <div className={`w-full bg-white ${className}`}>
    <div className={`${statusBarHeightClassName} w-full bg-[#D9D9D9]`} aria-hidden />
    <header className="flex items-center justify-between px-4 py-6">
      <div className="min-w-[48px]" aria-hidden />
      <LogoButton />
      <div className="min-w-[48px] text-right">{rightSlot}</div>
    </header>
  </div>
);
