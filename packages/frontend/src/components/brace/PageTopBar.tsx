import React from 'react';
import { Link } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';

type PageTopBarProps = {
  statusBarHeightClassName?: string;
  className?: string;
};

const LogoButton = () => (
  <Link to="/" aria-label="На главный экран" className="inline-flex items-center">
    <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />
  </Link>
);

export const PageTopBar = ({ className = '' }: PageTopBarProps) => (
  <div className={`w-full bg-white ${className}`}>
    <header className="px-4 py-6">
      <LogoButton />
    </header>
  </div>
);
