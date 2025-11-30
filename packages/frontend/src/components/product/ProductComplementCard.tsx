import cartIcon from '@/assets/images/icon-cart.svg';

export type ProductComplementCardProps = {
  id: string;
  isNew?: boolean;
  tags: string[];
  price: string;
  ratingCount: string;
  ratingValue: string;
};

const ProductComplementCard = ({
  isNew,
  tags,
  price,
  ratingCount,
  ratingValue,
}: ProductComplementCardProps) => {
  return (
    <div className="flex flex-col">
      <div className="relative w-full aspect-[232/309] rounded-[16px] bg-[#D9D9D9]">
        {isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[11px] font-semibold font-mono leading-none text-white">
            new
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#F3F3F7] px-2 py-1 text-[10px] font-medium leading-tight text-[#29292B]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
        <span className="text-[18px] font-bold leading-none text-[#29292B] whitespace-nowrap">{price}</span>
        <div className="flex items-center gap-2 text-[12px] leading-none whitespace-nowrap">
          <span className="font-medium text-[#BABABA]">{ratingCount} оценок</span>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="font-semibold text-[#29292B]">{ratingValue}</span>
            <svg
              aria-hidden
              className="h-3 w-3 shrink-0"
              viewBox="0 0 16 16"
              fill="#FFC700"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 1.333 9.978 6.02l4.689.016-3.77 2.905 1.408 4.559L8 10.88l-4.305 2.62 1.409-4.558-3.77-2.905 4.688-.017L8 1.333Z" />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#000043] text-[16px] font-semibold text-white transition duration-150 ease-out hover:bg-[#000050] active:scale-[0.97]"
      >
        <img src={cartIcon} alt="" className="h-5 w-5 invert" />
        <span className="leading-none">в корзину</span>
      </button>
    </div>
  );
};

export default ProductComplementCard;
