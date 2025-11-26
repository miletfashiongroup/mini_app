import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  label?: string;
  className?: string;
};

export const BackButton = ({ label = 'Назад', className }: Props) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (window.history.length > 2) {
      navigate(-1);
      return;
    }
    navigate('/');
  }, [navigate]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-full border border-brace-surface bg-white/80 px-4 py-2 text-sm font-medium text-brace-zinc shadow-sm transition hover:bg-white ${className ?? ''}`}
      aria-label={label}
    >
      <ArrowLeftIcon className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </button>
  );
};
