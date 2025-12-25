import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import starIcon from '@/assets/images/StarIcon.svg';
import { Modal } from '@/shared/ui/Modal';

import ProductMainCTA from './ProductMainCTA';

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
  onToggle,
  className = '',
  style,
}: {
  text: string;
  onToggle?: () => void;
  className?: string;
  style?: CSSProperties;
}) => (
  <div
    className={`relative z-10 w-full max-w-full self-start rounded-[16px] border border-[#E5E5E5] bg-white px-4 pt-3 pb-4 min-h-[140px] ${className}`}
    style={{ marginTop: '-27px', ...style }}
  >
    <p className="break-words text-[12px] leading-[1.4] text-[#29292B]">{text}</p>
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
    <div className="flex min-w-0 flex-1 flex-col items-start">
      <ReviewTextBubble text={review.text} />
    </div>
  </div>
);

const ReviewGallery = ({
  images = [],
  onImageClick,
}: {
  images?: string[];
  onImageClick?: (src: string) => void;
}) => (
  images.length ? (
    <div className="flex max-w-full flex-row gap-3 overflow-x-auto">
      {images.map((src, index) => (
        <button
          key={`${src}-${index}`}
          type="button"
          className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[12px] bg-[#D9D9D9]"
          onClick={() => {
            if (onImageClick) {
              onImageClick(src);
            }
          }}
          aria-label="Открыть фото отзыва"
        >
          <img src={src} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  ) : null
);

const ReviewHelpfulBlock = ({ helpfulCount = 0, notHelpfulCount = 0 }: { helpfulCount?: number; notHelpfulCount?: number }) => (
  <div className="flex flex-wrap items-center gap-3 text-[12px]">
    <span className="text-[#8E8E8E]">Вам был полезен этот отзыв?</span>
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2 py-[2px] text-[#29292B]">
        <span>👍</span>
        <span>{helpfulCount}</span>
      </div>
      <div className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-2 py-[2px] text-[#29292B]">
        <span>👎</span>
        <span>{notHelpfulCount}</span>
      </div>
    </div>
  </div>
);

const ReviewFooter = ({
  review,
  onImageClick,
}: {
  review: ProductReview;
  onImageClick?: (src: string) => void;
}) => (
  <div className="mt-3 grid grid-cols-[96px_minmax(0,1fr)] gap-3">
    <div />
    <div className="flex min-w-0 flex-col gap-3">
      <ReviewGallery images={review.gallery ?? []} onImageClick={onImageClick} />
      <ReviewHelpfulBlock helpfulCount={review.helpfulCount} notHelpfulCount={review.notHelpfulCount} />
    </div>
  </div>
);

const ProductReviewCard = ({ review, onImageClick }: { review: ProductReview; onImageClick?: (src: string) => void }) => {
  const ratingStarsCount = review.ratingStarsCount ?? 5;

  return (
    <article className="px-4 mt-4">
      <div className="w-full rounded-[16px] bg-white p-4 text-[#29292B] font-montserrat">
        <ReviewHeader name={review.name} status={review.status} ratingStarsCount={ratingStarsCount} />
        <ReviewMetaAndText review={review} />
        <ReviewFooter review={review} onImageClick={onImageClick} />
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section className="mt-4">
      {reviews.length ? (
        reviews.map((review) => (
          <ProductReviewCard key={review.id} review={review} onImageClick={setSelectedImage} />
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
      <Modal
        isOpen={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
        title="Фото отзыва"
      >
        {selectedImage ? (
          <img src={selectedImage} alt="" className="w-full max-h-[70vh] object-contain" />
        ) : null}
      </Modal>
    </section>
  );
};

export default ProductReviewsSection;
