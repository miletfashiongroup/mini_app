import cartIcon from '@/assets/images/icon-cart.svg';

type ProductBottomBarProps = {
  onAddToCart?: () => void;
  onBuyNow?: () => void;
};

const ProductBottomBar = ({ onAddToCart, onBuyNow }: ProductBottomBarProps) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 h-20 rounded-2xl bg-[#D9D9D9] px-4 py-3 shadow-md">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onAddToCart}
          className="flex h-12 w-1/2 items-center justify-center gap-2 rounded-[12px] bg-white text-[14px] font-semibold text-[#29292B] transition duration-150 ease-out hover:bg-[#F2F2F2] active:scale-[0.97]"
        >
          <img src={cartIcon} alt="" className="h-5 w-5" />
          <span className="leading-none">в корзину</span>
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          className="flex h-12 w-1/2 items-center justify-center gap-2 rounded-[12px] bg-white text-[14px] font-semibold text-[#29292B] transition duration-150 ease-out hover:bg-[#F2F2F2] active:scale-[0.97]"
        >
          <svg
            aria-hidden
            className="h-5 w-5 text-[#29292B]"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13.5 2 5 13h7l-1.5 9L21 9h-7l-0.5-7Z" />
          </svg>
          <span className="leading-none">купить сразу</span>
        </button>
      </div>
    </div>
  );
};

export default ProductBottomBar;
