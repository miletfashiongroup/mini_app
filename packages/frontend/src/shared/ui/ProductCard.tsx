import cartIcon from '@/assets/images/icon-cart.svg';
import { Button } from '@/shared/ui/Button';

export type ProductCardProps = {
  id: string;
  tags?: string[];
  price: string;
  ratingCount?: string;
  ratingValue?: string;
  isNew?: boolean;
  onClick?: () => void;
  onAddToCart?: () => void;
  defaultSize?: string;
  imageUrl?: string | null;
};

export const ProductCard = ({
  tags = [],
  price,
  ratingCount = '—',
  ratingValue = '—',
  isNew,
  onClick,
  onAddToCart,
  defaultSize,
  imageUrl,
}: ProductCardProps) => (
  <div className="flex flex-col">
    <button
      type="button"
      className="relative w-full aspect-[232/309] rounded-[16px] bg-gray-100 transition duration-150 ease-out active:scale-[0.98] overflow-hidden"
      onClick={onClick}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[12px] text-[#9C9CA3]">
          Нет фото
        </div>
      )}
      {isNew && (
        <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold font-mono leading-none text-white">
          new
        </span>
      )}
    </button>

    <div className="mt-2 flex flex-nowrap gap-x-1.5 gap-y-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="max-w-[140px] truncate whitespace-nowrap rounded-full bg-gray-50 px-2.5 py-1 text-[12px] font-medium leading-tight text-text-primary"
        >
          {tag}
        </span>
      ))}
    </div>

    <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
      <span className="text-[18px] font-bold leading-none text-text-primary whitespace-nowrap">{price}</span>
      <div className="flex items-center gap-2 text-[12px] leading-none whitespace-nowrap">
        <span className="font-medium text-text-secondary">{ratingCount} оценки</span>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="font-semibold text-text-primary">{ratingValue}</span>
          <svg aria-hidden className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="#FFC700" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1.333 9.978 6.02l4.689.016-3.77 2.905 1.408 4.559L8 10.88l-4.305 2.62 1.409-4.558-3.77-2.905 4.688-.017L8 1.333Z" />
          </svg>
        </div>
      </div>
    </div>

    <Button
      variant="primary"
      className="mt-3 h-12 w-full gap-2"
      onClick={(e) => {
        e.stopPropagation();
        onAddToCart?.();
      }}
      disabled={!defaultSize}
    >
      <img src={cartIcon} alt="" className="h-5 w-5 invert" />
      <span className="leading-none">{defaultSize ? 'в корзину' : 'нет размера'}</span>
    </Button>
  </div>
);
