import ProductMainCTA from './ProductMainCTA';

export type ProductReview = {
  id: string;
  name: string;
  status: string;
  ratingValue: string;
  sizeLabel: string;
  purchaseDate: string;
  text: string;
  helpfulCount: number;
  notHelpfulCount: number;
  utpLabel?: string;
  utpSegments?: number;
  utpActiveIndex?: number;
  galleryCount?: number;
};

const ProductReviewHeader = ({ name, status }: Pick<ProductReview, 'name' | 'status'>) => {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-full bg-[#D9D9D9]" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold text-[#29292B]">{name}</span>
          <div className="flex items-center gap-0.5 ml-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <svg
                key={idx}
                aria-hidden
                className="h-3 w-3"
                viewBox="0 0 16 16"
                fill="#FFC700"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 1.333 9.978 6.02l4.689.016-3.77 2.905 1.408 4.559L8 10.88l-4.305 2.62 1.409-4.558-3.77-2.905 4.688-.017L8 1.333Z" />
              </svg>
            ))}
          </div>
        </div>
        <span className="-mt-1 text-[12px] font-medium text-[#BABABA]">{status}</span>
      </div>
    </div>
  );
};

const ProductReviewMeta = ({ sizeLabel, purchaseDate }: Pick<ProductReview, 'sizeLabel' | 'purchaseDate'>) => {
  return (
    <div className="flex flex-col gap-2 text-[11px] leading-tight text-[#29292B] mt-2">
      <div className="flex flex-col">
        <span className="font-semibold text-[#29292B]">Размер</span>
        <span className="font-medium text-[#29292B]/80">{sizeLabel}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-[#29292B]">Дата покупки</span>
        <span className="font-medium text-[#BABABA]">{purchaseDate}</span>
      </div>
    </div>
  );
};

const ProductReviewTextBubble = ({ text }: Pick<ProductReview, 'text'>) => {
  return (
    <div className="flex flex-col -mt-1">
      <div className="rounded-[16px] border border-[#E5E5E5] bg-white px-3 py-2 text-[10px] font-medium leading-[1.4] text-[#29292B] min-h-[140px]">
        {text}
      </div>
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          className="flex items-center justify-center rounded-full px-3 py-1 text-[#29292B] text-[12px] transition duration-150 ease-out hover:bg-[#f5f5f5] active:scale-95"
        >
          <span className="text-lg leading-none">⌄</span>
        </button>
      </div>
    </div>
  );
};

const ProductReviewUTPBar = ({
  label = 'УТП 1',
  segments = 5,
  activeIndex = 2,
}: {
  label?: string;
  segments?: number;
  activeIndex?: number;
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-[#29292B]">{label}</span>
        <div className="flex flex-1 items-center gap-1">
          {Array.from({ length: segments }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-6 rounded-full ${
                idx === activeIndex ? 'bg-[#000043]' : 'bg-[#E5E5E5]'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-medium text-[#BABABA]">
        <span>МИН</span>
        <span>МАКС</span>
      </div>
    </div>
  );
};

const ProductReviewGallery = ({ imagesCount = 5 }: { imagesCount?: number }) => {
  return (
    <div className="mt-3 px-1">
      <div className="flex flex-row gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: imagesCount }).map((_, idx) => (
          <div key={idx} className="h-10 w-10 flex-shrink-0 rounded-[12px] bg-[#D9D9D9]" />
        ))}
      </div>
    </div>
  );
};

const ThumbUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 22V9a3 3 0 0 1 3-3h5l-1 5h5.5a1.5 1.5 0 0 1 1.48 1.76l-1.1 6A2 2 0 0 1 17.9 21H7Z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 2v13a3 3 0 0 1-3 3H9l1-5H4.5A1.5 1.5 0 0 1 3.02 11.24l1.1-6A2 2 0 0 1 6.1 3H17Z" />
    <path d="M17 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3" />
  </svg>
);

const ProductReviewHelpful = ({
  helpfulCount,
  notHelpfulCount,
}: {
  helpfulCount: number;
  notHelpfulCount: number;
}) => {
  return (
    <div className="mt-3">
      <div className="text-[12px] font-medium text-[#29292B]">Вам был полезен этот отзыв?</div>
      <div className="mt-2 flex items-center gap-4 text-[12px] text-[#29292B]">
        <div className="flex items-center gap-1">
          <ThumbUpIcon />
          <span>{helpfulCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbDownIcon />
          <span>{notHelpfulCount}</span>
        </div>
      </div>
    </div>
  );
};

const ProductReviewCard = ({ review }: { review: ProductReview }) => {
  const utpSegments = review.utpSegments ?? 5;
  const utpActiveIndex = review.utpActiveIndex ?? 2;
  const galleryCount = review.galleryCount ?? 5;

  return (
    <article className="px-4 mt-4">
      <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-4">
        <ProductReviewHeader name={review.name} status={review.status} />

        <div className="-mt-1 grid grid-cols-[minmax(90px,0.35fr)_minmax(0,1.65fr)] gap-4 items-start">
          <ProductReviewMeta sizeLabel={review.sizeLabel} purchaseDate={review.purchaseDate} />
          <ProductReviewTextBubble text={review.text} />
        </div>

        <div className="mt-4">
          <ProductReviewUTPBar label={review.utpLabel ?? 'УТП 1'} segments={utpSegments} activeIndex={utpActiveIndex} />
        </div>

        <ProductReviewGallery imagesCount={galleryCount} />

        <ProductReviewHelpful helpfulCount={review.helpfulCount} notHelpfulCount={review.notHelpfulCount} />
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
      <span className="text-[14px]">⌄</span>
    </button>
  </div>
);

const ProductReviewsSection = ({ reviews }: { reviews: ProductReview[] }) => {
  return (
    <section className="mt-4">
      {reviews.map((review) => (
        <ProductReviewCard key={review.id} review={review} />
      ))}
      <ProductReviewsMoreLink />
      <ProductMainCTA className="mt-4 mb-8" />
    </section>
  );
};

export default ProductReviewsSection;
