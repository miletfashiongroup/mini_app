import cartIcon from '@/assets/images/icon-cart.svg';

type ProductMainCTAProps = {
  onAddToCart?: () => void;
  label?: string;
  className?: string;
};

const ProductMainCTA = ({ onAddToCart, label = 'в корзину', className }: ProductMainCTAProps) => {
  return (
    <div className={className ?? 'px-4 mt-4 mb-8 flex justify-center'}>
      <button
        type="button"
        onClick={onAddToCart}
        className="flex h-11 w-56 items-center justify-center gap-2 rounded-[12px] bg-[#000043] text-[16px] font-semibold text-white transition duration-150 ease-out hover:bg-[#000050] active:scale-[0.97] mx-auto"
      >
        <img src={cartIcon} alt="" className="h-5 w-5 invert" />
        <span className="leading-none">{label}</span>
      </button>
    </div>
  );
};

export default ProductMainCTA;
