import starIcon from '@/assets/images/StarIcon.svg';
import ProductMainCTA from './ProductMainCTA';

export type ProductReview = {
  id: string;
  name: string;
  status: string;
  ratingStarsCount?: number;
  sizeLabel: string;
  purchaseDate: string;
  text: string;
  helpfulCount?: number;
  notHelpfulCount?: number;
  utpLabel?: string;
  utpSegments?: number;
  utpActiveIndex?: number;
  galleryCount?: number;
};

const StarIconImg = () => <img src={starIcon} alt="" className="h-3 w-3" />;

const ReviewRatingStars = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-row items-center gap-[2px]">
    {Array.from({ length: count }).map((_, idx) => (
      <StarIconImg key={idx} />
    ))}
  </div>
);

const ReviewAvatar = () => (
  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#D9D9D9]">
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 text-[#A3A3A3]" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c1.5-3 4.5-4.5 7-4.5S17.5 17 19 20" strokeLinecap="round" />
    </svg>
  </div>
);

const ReviewHeader = ({ name, status, ratingStarsCount = 5 }: Pick<ProductReview, 'name' | 'status'> & { ratingStarsCount?: number }) => (
  <div className="flex flex-row items-start gap-3">
    <ReviewAvatar />
    <div className="flex flex-col flex-1">
      <div className="flex flex-row items-center gap-2">
        <span className="text-[14px] font-semibold text-[#29292B]">{name}</span>
        <div style={{ marginLeft: '30px' }}>
          <ReviewRatingStars count={ratingStarsCount} />
        </div>
      </div>
      <span className="mt-[2px] text-[12px] text-[#BABABA]">{status}</span>
    </div>
  </div>
);

const ReviewMeta = ({ sizeLabel, purchaseDate }: Pick<ProductReview, 'sizeLabel' | 'purchaseDate'>) => (
  <div className="flex flex-col gap-3 text-[12px] leading-[1.3]">
    <div className="flex flex-col">
      <span className="font-semibold text-[#29292B]">Размер:</span>
      <span className="text-[#29292B]">{sizeLabel}</span>
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-[#29292B]">Дата покупки:</span>
      <span className="text-[#BABABA]">{purchaseDate}</span>
    </div>
  </div>
);

const ChevronDownIcon = () => (
  <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 6.5 8 10.5 12 6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ReviewTextBubble = ({
  text,
  onToggle,
  className = '',
  style,
}: {
  text: string;
  onToggle?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`relative z-10 inline-block self-start rounded-[16px] border border-[#E5E5E5] bg-white px-4 pt-3 pb-4 min-h-[140px] ${className}`}
    style={{ width: '305px', marginTop: '-27px', marginLeft: '25px', ...style }}
  >
    <p className="text-[12px] leading-[1.4] text-[#29292B]">{text}</p>
    <button
      type="button"
      onClick={onToggle}
      className="mt-2 flex w-full items-center justify-center text-[12px] text-[#29292B]"
      aria-label="Показать полный отзыв"
    >
      <ChevronDownIcon />
    </button>
  </div>
);

const ReviewMetaAndText = ({ review }: { review: ProductReview }) => (
  <div className="mt-3 flex items-start gap-3">
    <div className="w-[96px] flex-shrink-0">
      <ReviewMeta sizeLabel={review.sizeLabel} purchaseDate={review.purchaseDate} />
    </div>
    <div className="flex flex-1 flex-col items-start">
      <ReviewTextBubble text={review.text} />
    </div>
  </div>
);

const ReviewUtpBar = ({ label = 'УТП 1', segments = 5, activeIndex = 0 }: { label?: string; segments?: number; activeIndex?: number }) => {
  const safeSegments = Math.max(1, segments);
  const clampedActive = Math.min(Math.max(activeIndex, 0), safeSegments - 1);
  const denominator = Math.max(safeSegments - 1, 1);
  const activePercent = (clampedActive / denominator) * 100;

  return (
    <div className="mt-4">
      <span className="text-[12px] font-semibold text-[#29292B]">{label}</span>

      <div className="mt-2">
        <div className="relative h-3 mb-1">
          <div className="absolute left-0 w-[120px] top-1/2 h-[1px] -translate-y-1/2 bg-[#D9D9D9]" />
          <div className="absolute left-0 w-[120px] top-1/2 -translate-y-1/2 flex justify-between px-[4px]">
            {Array.from({ length: safeSegments }).map((_, index) => (
              <span key={index} className="h-[3px] w-[10px] rounded-full bg-[#D9D9D9]" />
            ))}
          </div>
          <div className="hidden" />
        </div>

        <div className="mt-1 flex flex-row items-center gap-3 text-[10px] text-[#BABABA]" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
          <span style={{ marginLeft: '-5px' , marginTop: '-2px'}}>мин</span>
          <span style={{ marginLeft: '62px' , marginTop: '-2px'}}>макс</span>
        </div>
      </div>
    </div>
  );
};

const ReviewGallery = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-row gap-3" style={{ marginLeft: '130px', marginTop: '-60px' }}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="w-20 aspect-[232/309] flex-shrink-0 overflow-hidden rounded-[25px] bg-[#D9D9D9]"
        style={{ borderRadius: '10px' }}
      />
    ))}
  </div>
);

const ReviewHelpfulBlock = ({ helpfulCount = 0, notHelpfulCount = 0 }: { helpfulCount?: number; notHelpfulCount?: number }) => (
  <div className="mt-4" style={{ marginLeft: '130px' }}>
    <p className="text-[12px] font-semibold text-[#29292B]">Вам был полезен этот отзыв?</p>
    <div className="mt-1 flex flex-row items-center gap-6 text-[12px] text-[#29292B]">
      <div className="flex flex-row items-center gap-1">
        <span>👍</span>
        <span>{helpfulCount}</span>
      </div>
      <div className="flex flex-row items-center gap-1">
        <span>👎</span>
        <span>{notHelpfulCount}</span>
      </div>
    </div>
  </div>
);

const ProductReviewCard = ({ review }: { review: ProductReview }) => {
  const ratingStarsCount = review.ratingStarsCount ?? 5;
  const galleryCount = review.galleryCount ?? 5;

  return (
    <article className="px-4 mt-4">
      <div className="w-full rounded-[16px] bg-white p-4 text-[#29292B] font-montserrat">
        <ReviewHeader name={review.name} status={review.status} ratingStarsCount={ratingStarsCount} />
        <ReviewMetaAndText review={review} />
        <ReviewUtpBar label={review.utpLabel ?? 'УТП 1'} segments={review.utpSegments ?? 5} activeIndex={review.utpActiveIndex ?? 0} />
        <ReviewGallery count={galleryCount} />
        <ReviewHelpfulBlock helpfulCount={review.helpfulCount} notHelpfulCount={review.notHelpfulCount} />
      </div>
    </article>
  );
};

const ProductReviewsMoreLink = ({ onClick }: { onClick?: () => void }) => (
  <div className="px-4 mt-4 mb-4">
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-[14px] font-medium text-[#29292B] transition duration-150 ease-out hover:text-[#1f1f21] active:scale-[0.97]"
    >
      <span>Больше отзывов</span>
      <ChevronDownIcon />
    </button>
  </div>
);

const ProductReviewsSection = ({ reviews }: { reviews: ProductReview[] }) => (
  <section className="mt-4">
    {reviews.map((review) => (
      <ProductReviewCard key={review.id} review={review} />
    ))}
    <ProductReviewsMoreLink />
    <ProductMainCTA className="mt-4 mb-8" />
  </section>
);

export default ProductReviewsSection;
