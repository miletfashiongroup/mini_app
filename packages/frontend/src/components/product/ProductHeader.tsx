import arrowLeft from '@/assets/images/icon-arrow-left.svg';
import logoBrace from '@/assets/images/logo-brace.svg';

type ProductHeaderProps = {
  onBack?: () => void;
};

const ProductHeader = ({ onBack }: ProductHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 pt-3 pb-2">
      <button
        type="button"
        aria-label="Назад"
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white transition duration-150 ease-out hover:bg-[#f7f7f7] active:scale-[0.96]"
      >
        <img src={arrowLeft} alt="" className="h-5 w-5" />
      </button>
      <img src={logoBrace} alt="Brace" className="h-[26px] w-auto" />
    </header>
  );
};

export default ProductHeader;
