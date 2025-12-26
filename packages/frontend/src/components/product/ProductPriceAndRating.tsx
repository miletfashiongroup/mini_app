import { pluralize } from '@/shared/lib/pluralize';

type ProductPriceAndRatingProps = {
  price: string;
  ratingCount: string;
  ratingValue: string;
};

const ProductPriceAndRating = ({ price, ratingCount, ratingValue }: ProductPriceAndRatingProps) => {
  const ratingLabel = pluralize(ratingCount, 'оценка', 'оценки', 'оценок');
  return (
    <div className="px-4 mt-4 flex items-center justify-between">
      <span className="text-[20px] font-bold text-[#29292B]">{price}</span>
      <div className="flex items-center gap-2 text-[12px] leading-none">
        <span className="font-medium text-[#BABABA]">
          {ratingCount} {ratingLabel}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-[#29292B]">{ratingValue}</span>
          <svg
            aria-hidden
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="#FFC700"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 1.333 9.978 6.02l4.689.016-3.77 2.905 1.408 4.559L8 10.88l-4.305 2.62 1.409-4.558-3.77-2.905 4.688-.017L8 1.333Z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ProductPriceAndRating;
