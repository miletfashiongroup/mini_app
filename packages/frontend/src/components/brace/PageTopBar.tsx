import React from 'react';
import { useNavigate } from 'react-router-dom';

import arrowLeftIcon from '@/assets/images/icon-arrow-left.svg';
import logoBrace from '@/assets/images/logo-brace.svg';

type BackButtonVariant = 'round' | 'ghost';

type PageTopBarProps = {
  statusBarHeightClassName?: string;
  backButtonVariant?: BackButtonVariant;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
};

const BackButton = ({ variant = 'ghost', onBack }: { variant?: BackButtonVariant; onBack?: () => void }) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (variant === 'round') {
    return (
      <button
        type="button"
        aria-label="Назад"
        onClick={handleBack}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#000043] transition duration-150 ease-out hover:brightness-105 active:scale-[0.96]"
      >
        <img src={arrowLeftIcon} alt="" className="h-5 w-5 invert" />
      </button>
    );
  }

  return (
    <button type="button" aria-label="Назад" onClick={handleBack} className="flex items-center gap-2">
      <img src={arrowLeftIcon} alt="" className="h-12 w-12" />
      <span className="text-sm font-medium text-[#29292B]">Назад</span>
    </button>
  );
};

const Logo = () => <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />;

export const PageTopBar = ({
  statusBarHeightClassName = 'h-14',
  backButtonVariant = 'ghost',
  onBack,
  rightSlot,
  className = '',
}: PageTopBarProps) => (
  <div className={`w-full bg-white ${className}`}>
    <div className={`${statusBarHeightClassName} w-full bg-[#D9D9D9]`} aria-hidden />
    <header className="flex items-center justify-between px-4 py-4">
      <BackButton variant={backButtonVariant} onBack={onBack} />
      <Logo />
      <div className="min-w-[48px] text-right">{rightSlot}</div>
    </header>
  </div>
);
