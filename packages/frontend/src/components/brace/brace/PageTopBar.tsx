import React from 'react';
import { Link } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';
import { BackButton } from './BackButton';

type PageTopBarProps = {
  statusBarHeightClassName?: string;
  className?: string;
  showBack?: boolean;
  backTo?: string;
  backFallback?: string;
  backLabel?: string;
};

const LogoButton = () => (
  <Link to="/" aria-label="На главный экран" className="inline-flex items-center">
    <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />
  </Link>
);

export const PageTopBar = ({
  className = '',
  showBack = false,
  backTo,
  backFallback,
  backLabel = 'Назад',
}: PageTopBarProps) => {
  const shouldShowBack = showBack || Boolean(backTo) || Boolean(backFallback);

  return (
    <div className={`w-full bg-white ${className}`}>
      <header className="flex items-center gap-3 px-4 py-6">
        {shouldShowBack ? (
          <BackButton
            iconOnly
            label={backLabel}
            to={backTo}
            fallbackTo={backFallback}
            className="shrink-0"
          />
        ) : null}
        <LogoButton />
      </header>
    </div>
  );
};
