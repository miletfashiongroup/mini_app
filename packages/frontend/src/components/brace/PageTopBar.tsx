import React from 'react';
import { useNavigate } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';

type PageTopBarProps = {
  statusBarHeightClassName?: string;
  className?: string;
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
}: PageTopBarProps) => (
  <div className={`w-full bg-white ${className}`}>
    <div className={`${statusBarHeightClassName} w-full bg-[#D9D9D9]`} aria-hidden />
    <header className="px-4 py-6">
      <LogoButton />
    </header>
  </div>
);
