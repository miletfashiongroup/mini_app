import arrowLeft from '@/assets/images/icon-arrow-left.svg';
import logoBrace from '@/assets/images/logo-brace.svg';

type ProductHeaderProps = {
  onBack?: () => void;
};

const ProductHeader = ({ onBack }: ProductHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 pt-3 pb-2">
      <button type="button" aria-label="Назад" onClick={onBack} className="p-2">
        <img src={arrowLeft} alt="" className="h-12 w-12" />
      </button>
      <img src={logoBrace} alt="Brace" className="h-[38px] w-auto" />
    </header>
  );
};

export default ProductHeader;
