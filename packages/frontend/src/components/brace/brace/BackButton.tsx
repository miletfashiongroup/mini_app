import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  label?: string;
  className?: string;
  iconOnly?: boolean;
  to?: string;
  fallbackTo?: string;
};

const getFromState = (state: unknown) => {
  if (!state || typeof state !== 'object') {
    return null;
  }
  const candidate = (state as { from?: unknown }).from;
  return typeof candidate === 'string' && candidate.length ? candidate : null;
};

export const BackButton = ({
  label = 'Назад',
  className,
  iconOnly = false,
  to,
  fallbackTo,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = getFromState(location.state);
  const target = to ?? fromState;

  const handleClick = useCallback(() => {
    if (target) {
      navigate(target);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo ?? '/');
  }, [fallbackTo, navigate, target]);

  const baseClassName =
    'inline-flex items-center gap-2 rounded-full border border-brace-surface bg-white/80 text-sm font-medium text-brace-zinc shadow-sm transition hover:bg-white';
  const sizingClassName = iconOnly ? 'h-9 w-9 justify-center p-0' : 'px-4 py-2';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClassName} ${sizingClassName} ${className ?? ''}`}
      aria-label={label}
    >
      <ArrowLeftIcon className="h-4 w-4" aria-hidden />
      {!iconOnly ? <span>{label}</span> : null}
    </button>
  );
};
