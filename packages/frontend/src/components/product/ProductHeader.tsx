import { useNavigate } from 'react-router-dom';

import logoBrace from '@/assets/images/logo-brace.svg';

type ProductHeaderProps = {
  className?: string;
  rightSlot?: React.ReactNode;
};

const ProductHeader = ({ className = '', rightSlot }: ProductHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className={`w-full bg-white ${className}`}>
      <header className="flex items-center justify-between px-4 py-6">
        <button type="button" aria-label="На главный экран" onClick={() => navigate('/')} className="flex items-center">
          <img src={logoBrace} alt="BRACE logo" className="h-10 w-auto" />
        </button>
        <div className="min-w-[48px] text-right">{rightSlot}</div>
      </header>
    </div>
  );
};

export default ProductHeader;
