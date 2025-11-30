import cartIcon from '@/assets/images/icon-cart.svg';

type ProductSizeTableBlockProps = {
  onOpenSizeTable?: () => void;
  onAddToCart?: () => void;
};

const ProductSizeTableBlock = ({ onOpenSizeTable, onAddToCart }: ProductSizeTableBlockProps) => {
  return (
    <div className="px-4 mt-2 flex items-center justify-between">
      <button
        type="button"
        onClick={onOpenSizeTable}
        className="flex flex-col items-start text-left transition duration-150 ease-out hover:text-[#1f1f21] active:scale-[0.98]"
      >
        <div className="flex items-center gap-1">
          <span className="text-[14px] font-semibold text-[#29292B]">Таблица размеров</span>
          <span className="align-middle text-[#BABABA] text-[12px] font-medium">›</span>
        </div>
        <span className="text-[12px] font-medium text-[#BABABA]">подробнее</span>
      </button>
      <button
        type="button"
        onClick={onAddToCart}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#000043] transition duration-150 ease-out hover:bg-[#000050] active:scale-[0.96]"
      >
        <img src={cartIcon} alt="" className="h-5 w-5 invert" />
      </button>
    </div>
  );
};

export default ProductSizeTableBlock;
