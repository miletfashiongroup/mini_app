import { useNavigate } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';
import { BackButton } from '@/components/brace';

type ProductHeaderProps = {
  className?: string;
  rightSlot?: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
  backFallback?: string;
};

const ProductHeader = ({ className = '', rightSlot, showBack = false, backTo, backFallback }: ProductHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className={`w-full bg-white ${className}`}>
      <header className="flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          {showBack ? (
            <BackButton iconOnly label="Назад" to={backTo} fallbackTo={backFallback} className="shrink-0" />
          ) : null}
          <button
            type="button"
            aria-label="На главный экран"
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />
          </button>
        </div>
        <div className="min-w-[48px] text-right">{rightSlot}</div>
      </header>
    </div>
  );
};

export default ProductHeader;
