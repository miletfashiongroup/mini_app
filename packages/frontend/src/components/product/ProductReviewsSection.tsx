import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import starIcon from '@/assets/images/StarIcon.svg';
import ProductMainCTA from './ProductMainCTA';
import { ReviewImageLightbox } from './ReviewImageLightbox';

export type ProductReview = {
  id: string;
  name: string;
  status: string;
  ratingStarsCount?: number;
  sizeLabel?: string;
  purchaseDate?: string;
  text: string;
  helpfulCount?: number;
  notHelpfulCount?: number;
  utpLabel?: string;
  utpSegments?: number;
  utpActiveIndex?: number;
  gallery?: string[];
};

const StarIconImg = ({ filled }: { filled: boolean }) => (
  <img src={starIcon} alt="" className={`h-3 w-3 ${filled ? '' : 'opacity-25'}`} />
);

const ReviewRatingStars = ({ count = 5, total = 5 }: { count?: number; total?: number }) => {
  const safeTotal = Math.max(1, total);
  const safeCount = Math.min(Math.max(count, 0), safeTotal);
  return (
    <div className="flex flex-row items-center gap-[2px]">
      {Array.from({ length: safeTotal }).map((_, idx) => (
        <StarIconImg key={idx} filled={idx < safeCount} />
      ))}
    </div>
  );
};

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
    <div className="flex flex-1 flex-col gap-1 min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_72px] items-start gap-2">
        <span className="text-[14px] font-semibold text-[#29292B] truncate">{name}</span>
        <div className="flex justify-start">
          <ReviewRatingStars count={ratingStarsCount} />
        </div>
      </div>
      <span className="text-[12px] text-[#BABABA]">{status}</span>
    </div>
  </div>
);

const ReviewMeta = ({ sizeLabel, purchaseDate }: Pick<ProductReview, 'sizeLabel' | 'purchaseDate'>) => (
  <div className="flex flex-col gap-3 text-[12px] leading-[1.3]">
    <div className="flex flex-col">
      <span className="font-semibold text-[#29292B]">Размер:</span>
      <span className="text-[#29292B]">{sizeLabel || '—'}</span>
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-[#29292B]">Дата покупки:</span>
      <span className="text-[#BABABA]">{purchaseDate || '—'}</span>
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
  isExpanded = false,
  canExpand = false,
  onToggle,
  className = '',
  style,
  containerRef,
}: {
  text: string;
  isExpanded?: boolean;
  canExpand?: boolean;
  onToggle?: () => void;
  className?: string;
  style?: CSSProperties;
  containerRef?: React.Ref<HTMLDivElement>;
}) => (
  <div
    ref={containerRef}
    className={`relative w-full max-w-full self-start rounded-[16px] border border-[#E5E5E5] bg-white px-4 pt-3 pb-4 ${className}`}
    style={style}
  >
    <div className={`relative ${!isExpanded ? 'max-h-[140px] overflow-hidden' : ''}`}>
      <p className="break-words text-[12px] leading-[1.4] text-[#29292B]">{text}</p>
      {!isExpanded && canExpand ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-white/0" />
      ) : null}
    </div>
    {canExpand ? (
      <button
        type="button"
        onClick={onToggle}
        className="mt-2 flex w-full items-center justify-center text-[12px] text-[#29292B]"
        aria-label={isExpanded ? 'Свернуть отзыв' : 'Показать полный отзыв'}
      >
        <span className={`inline-flex transition ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
    ) : null}
  </div>
);

const ReviewMetaAndText = ({
  review,
  isExpanded,
  canExpand,
  onToggle,
  textContainerRef,
}: {
  review: ProductReview;
  isExpanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
  textContainerRef?: React.Ref<HTMLDivElement>;
}) => (
  <div className="mt-4 grid grid-cols-[96px_minmax(0,1fr)] items-start gap-3">
    <div className="w-[96px]">
      <ReviewMeta sizeLabel={review.sizeLabel} purchaseDate={review.purchaseDate} />
    </div>
    <div className="min-w-0">
      <ReviewTextBubble
        text={review.text}
        isExpanded={isExpanded}
        canExpand={canExpand}
        onToggle={onToggle}
        containerRef={textContainerRef}
      />
    </div>
  </div>
);

const ReviewGallery = ({
  images = [],
  onImageClick,
}: {
  images?: string[];
  onImageClick?: (index: number) => void;
}) => {
  const safeImages = images.filter(Boolean);
  return safeImages.length ? (
    <div className="flex max-w-full flex-row gap-3 overflow-x-auto">
      {safeImages.map((src, index) => (
        <button
          key={`${src}-${index}`}
          type="button"
          className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[12px] bg-[#D9D9D9]"
          onClick={() => {
            if (onImageClick) {
              onImageClick(index);
            }
          }}
          aria-label="Открыть фото отзыва"
        >
          <img src={src} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  ) : null;
};

const ReviewHelpfulBlock = ({
  helpfulCount = 0,
  notHelpfulCount = 0,
  activeVote = 0,
  onHelpful,
  onNotHelpful,
}: {
  helpfulCount?: number;
  notHelpfulCount?: number;
  activeVote?: -1 | 0 | 1;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-3 text-[12px]">
    <span className="text-[#8E8E8E]">Вам был полезен этот отзыв?</span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onHelpful}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[#29292B] transition ${
          activeVote === 1 ? 'border-[#29292B] bg-[#F6F6F6]' : 'border-[#E5E5E5] bg-white'
        }`}
        aria-pressed={activeVote === 1}
      >
        <span>👍</span>
        <span>{helpfulCount}</span>
      </button>
      <button
        type="button"
        onClick={onNotHelpful}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[#29292B] transition ${
          activeVote === -1 ? 'border-[#29292B] bg-[#F6F6F6]' : 'border-[#E5E5E5] bg-white'
        }`}
        aria-pressed={activeVote === -1}
      >
        <span>👎</span>
        <span>{notHelpfulCount}</span>
      </button>
    </div>
  </div>
);

const ReviewFooter = ({
  review,
  activeVote,
  onHelpful,
  onNotHelpful,
  onImageClick,
}: {
  review: ProductReview;
  activeVote: -1 | 0 | 1;
  onHelpful: () => void;
  onNotHelpful: () => void;
  onImageClick?: (index: number) => void;
}) => (
  <div className="mt-3 grid grid-cols-[96px_minmax(0,1fr)] gap-3">
    <div />
    <div className="flex min-w-0 flex-col gap-3">
      <ReviewGallery images={review.gallery ?? []} onImageClick={onImageClick} />
      <ReviewHelpfulBlock
        helpfulCount={review.helpfulCount}
        notHelpfulCount={review.notHelpfulCount}
        activeVote={activeVote}
        onHelpful={onHelpful}
        onNotHelpful={onNotHelpful}
      />
    </div>
  </div>
);

const ProductReviewCard = ({
  review,
  onImageClick,
}: {
  review: ProductReview;
  onImageClick?: (review: ProductReview, index: number) => void;
}) => {
  const ratingStarsCount = review.ratingStarsCount ?? 5;
  const [isExpanded, setIsExpanded] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.notHelpfulCount ?? 0);
  const [activeVote, setActiveVote] = useState<-1 | 0 | 1>(0);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [canExpand, setCanExpand] = useState(review.text.length > 220);
  const handleToggle = () => setIsExpanded((prev) => !prev);

  useLayoutEffect(() => {
    if (isExpanded || !textContainerRef.current) {
      return;
    }
    const el = textContainerRef.current;
    const hasOverflow = el.scrollHeight - el.clientHeight > 2;
    setCanExpand(hasOverflow || review.text.length > 220);
  }, [review.text, isExpanded]);

  const handleHelpful = () => {
    setActiveVote((prev) => {
      if (prev === 1) {
        setHelpfulCount((count) => Math.max(0, count - 1));
        return 0;
      }
      if (prev === -1) {
        setNotHelpfulCount((count) => Math.max(0, count - 1));
      }
      setHelpfulCount((count) => count + 1);
      return 1;
    });
  };

  const handleNotHelpful = () => {
    setActiveVote((prev) => {
      if (prev === -1) {
        setNotHelpfulCount((count) => Math.max(0, count - 1));
        return 0;
      }
      if (prev === 1) {
        setHelpfulCount((count) => Math.max(0, count - 1));
      }
      setNotHelpfulCount((count) => count + 1);
      return -1;
    });
  };

  return (
    <article className="px-4 mt-4">
      <div className="w-full rounded-[16px] bg-white p-4 text-[#29292B] font-montserrat">
        <ReviewHeader name={review.name} status={review.status} ratingStarsCount={ratingStarsCount} />
        <ReviewMetaAndText
          review={review}
          isExpanded={isExpanded}
          canExpand={canExpand}
          onToggle={handleToggle}
          textContainerRef={textContainerRef}
        />
        <ReviewFooter
          review={{ ...review, helpfulCount, notHelpfulCount }}
          activeVote={activeVote}
          onHelpful={handleHelpful}
          onNotHelpful={handleNotHelpful}
          onImageClick={(index) => onImageClick?.(review, index)}
        />
      </div>
    </article>
  );
};

const ProductReviewsMoreLink = ({ onClick, to }: { onClick?: () => void; to?: string }) => (
  <div className="px-4 mt-4 mb-4">
    {to ? (
      <Link
        to={to}
        className="relative z-10 inline-flex items-center gap-2 text-[14px] font-medium text-[#29292B] transition duration-150 ease-out hover:text-[#1f1f21] active:scale-[0.97]"
      >
        <span>Больше отзывов</span>
        <ChevronDownIcon />
      </Link>
    ) : (
      <button
        type="button"
        onClick={onClick}
        className="relative z-10 flex items-center gap-2 text-[14px] font-medium text-[#29292B] transition duration-150 ease-out hover:text-[#1f1f21] active:scale-[0.97]"
      >
        <span>Больше отзывов</span>
        <ChevronDownIcon />
      </button>
    )}
  </div>
);

const ProductReviewsSection = ({
  reviews,
  onMoreReviews,
  moreLinkTo,
  showCta = true,
}: {
  reviews: ProductReview[];
  onMoreReviews?: () => void;
  moreLinkTo?: string;
  showCta?: boolean;
}) => {
  const [activeReview, setActiveReview] = useState<ProductReview | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="mt-4">
      {reviews.length ? (
        reviews.map((review) => (
          <ProductReviewCard
            key={review.id}
            review={review}
            onImageClick={(targetReview, index) => {
              setActiveReview(targetReview);
              setActiveIndex(index);
            }}
          />
        ))
      ) : (
        <div className="px-4 mt-4 text-[12px] text-[#8E8E8E]">
          Отзывов пока нет.
        </div>
      )}
      {onMoreReviews || moreLinkTo ? (
        <ProductReviewsMoreLink onClick={onMoreReviews} to={moreLinkTo} />
      ) : null}
      {showCta ? <ProductMainCTA className="mt-4 mb-8" /> : null}
      <ReviewImageLightbox
        isOpen={Boolean(activeReview)}
        review={activeReview}
        activeIndex={activeIndex}
        onChangeIndex={setActiveIndex}
        onClose={() => {
          setActiveReview(null);
          setActiveIndex(0);
        }}
      />
    </section>
  );
};

export default ProductReviewsSection;
