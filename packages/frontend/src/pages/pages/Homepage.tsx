import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import figureBody from '@/assets/images/figure-body.svg';
import arrowLeft from '@/assets/images/icon-arrow-left.svg';
import arrowRight from '@/assets/images/icon-arrow-right.svg';
import checkIcon from '@/assets/images/icon-check.svg';
import newIcon from '@/assets/images/icon-new.svg';
import playIcon from '@/assets/images/icon-play.svg';
import logoBrace from '@/assets/images/logo-brace.svg';
import { AppBottomNav } from '@/components/brace';
import { SizeSelectModal } from '@/features/cart/add-to-cart/ui/SizeSelectModal';
import { calculateSize } from '@/features/size-calculator/api/sizeCalcApi';
import { useBannersQuery, useProductsQuery } from '@/shared/api/queries';
import { useToast } from '@/shared/hooks/useToast';
import { formatTag } from '@/shared/lib/tags';
import { formatPrice } from '@/shared/lib/money';
import { useFavoritesStore } from '@/shared/state/favoritesStore';

type BannerIndicatorsProps = {
  count?: number;
  activeIndex?: number;
  onSelect?: (index: number) => void;
  className?: string;
};

type VideoSectionProps = {
  onPlay?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

type CarouselCardProps = {
  isNew?: boolean;
  imageUrl?: string | null;
  ariaLabel: string;
  onClick?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
};

type CarouselItem = {
  id: string;
  isNew?: boolean;
  imageUrl?: string | null;
  tags?: string[];
  price: string;
  ratingCount?: string;
  ratingValue?: string;
  defaultSize?: string;
  sizes: string[];
};

const CARD_WIDTH = 232;
const CARD_HEIGHT = 309;
const GAP_PX = 24;

const DEFAULT_BANNER_RATIO = 656 / 300;

const SHOW_VIDEO_SECTION = false;

const HeaderHome = () => (
  <header className="px-4 py-6">
    <img src={logoBrace} alt="Логотип BRACE" className="h-10 w-auto" />
  </header>
);

const BannerPlaceholder = ({
  children,
  showLabel = true,
  aspectRatio,
  hasImage = false,
}: {
  children?: React.ReactNode;
  showLabel?: boolean;
  aspectRatio?: number;
  hasImage?: boolean;
}) => (
  <div
    className={`relative flex w-full items-center justify-center overflow-hidden rounded-[16px] ${hasImage ? 'bg-transparent' : 'bg-[#D9D9D9]'}`}
    style={{
      aspectRatio: aspectRatio ?? DEFAULT_BANNER_RATIO,
      minHeight: hasImage ? undefined : '210px',
    }}
  >
    {showLabel ? <span className="text-[16px] font-semibold text-[#BABABA]">Баннер</span> : null}
    {children}
  </div>
);

const BannerCarousel = () => {
  const { data, isLoading, isError } = useBannersQuery();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const banners = data?.banners ?? [];

  useEffect(() => {
    setActiveIndex(data?.active_index ?? 0);
  }, [data?.active_index]);
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (isLoading) {
    return <p className="text-[14px] font-medium text-[#BABABA]">Загружаем баннеры...</p>;
  }
  if (isError) {
    return <p className="text-[14px] font-medium text-[#BABABA]">Не удалось загрузить баннеры.</p>;
  }
  if (banners.length === 0) {
    return <p className="text-[14px] font-medium text-[#BABABA]">Баннеров пока нет.</p>;
  }

  const activeBanner = banners[Math.min(activeIndex, banners.length - 1)];
  const hasImage =
    Boolean(activeBanner?.image_url) && !failedUrls[activeBanner.image_url];
  const activeRatio = activeBanner?.image_url
    ? aspectRatios[activeBanner.image_url]
    : undefined;

  return (
    <div className="relative">
      <BannerPlaceholder showLabel={!hasImage} aspectRatio={activeRatio} hasImage={hasImage}>
        <div
          className="relative h-full w-full"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
            touchDeltaX.current = 0;
          }}
          onTouchMove={(event) => {
            if (touchStartX.current === null) return;
            touchDeltaX.current = (event.touches[0]?.clientX ?? 0) - touchStartX.current;
          }}
          onTouchEnd={() => {
            if (touchStartX.current === null) return;
            const delta = touchDeltaX.current;
            touchStartX.current = null;
            touchDeltaX.current = 0;
            if (Math.abs(delta) < 40) return;
            if (delta > 0) {
              setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
            } else {
              setActiveIndex((prev) => (prev + 1) % banners.length);
            }
          }}
        >
          {banners.map((banner, index) => {
            if (!banner.image_url) {
              return null;
            }
            const isActive = index === activeIndex;
            if (failedUrls[banner.image_url]) {
              return null;
            }
            return (
              <img
                key={banner.id}
                src={banner.image_url}
                alt="Баннер"
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ borderRadius: 16 }}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (!img.naturalWidth || !img.naturalHeight) return;
                  const ratio = img.naturalWidth / img.naturalHeight;
                  setAspectRatios((prev) =>
                    prev[banner.image_url] ? prev : { ...prev, [banner.image_url]: ratio },
                  );
                }}
                onError={() =>
                  setFailedUrls((prev) => ({ ...prev, [banner.image_url]: true }))
                }
              />
            );
          })}
        </div>
        <div className="absolute bottom-3 left-0 right-0">
          <BannerIndicators
            count={banners.length}
            activeIndex={activeIndex}
            onSelect={(index) => setActiveIndex(index)}
            className="mt-0"
          />
        </div>
      </BannerPlaceholder>
    </div>
  );
};

const BannerIndicators = ({ count = 3, activeIndex = 0, onSelect, className }: BannerIndicatorsProps) => (
  <div className={`flex items-center justify-center gap-1 ${className ?? 'mt-4'}`}>
    {Array.from({ length: count }).map((_, index) => {
      const isActive = index === activeIndex;

      return (
        <button
          key={index}
          type="button"
          aria-label={`Слайд ${index + 1}`}
          onClick={() => onSelect?.(index)}
          className={`h-2 w-2 rounded-full transition-all duration-200 ${
            isActive ? 'bg-[#FFFFFF] shadow-[0_0_0_1px_#BABABA]' : 'bg-[#BABABA]'
          } ${onSelect ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
        />
      );
    })}
  </div>
);

const TitleBannerSection = () => (
  <section className="px-4 mt-2">
    <h2 className="text-[21px] font-bold text-text-primary">Главные новинки</h2>
    <div className="mt-4">
      <BannerCarousel />
    </div>
  </section>
);

const VideoSection = ({ onPlay, onPrev, onNext }: VideoSectionProps) => (
  <section className="px-4">
    <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] items-center justify-items-center gap-2">
      <button
        type="button"
        aria-label="Предыдущее видео"
        onClick={onPrev}
        className="flex h-12 w-12 items-center justify-center rounded-full transition duration-150 ease-out hover:brightness-110 active:scale-[0.96]"
      >
        <img src={arrowLeft} alt="" className="h-12 w-12" />
      </button>

      <button
        type="button"
        aria-label="Воспроизвести видео"
        onClick={onPlay}
        className="relative flex aspect-square w-full max-w-[350px] items-center justify-center rounded-[16px] bg-[#D9D9D9] transition duration-150 ease-out active:scale-[0.98]"
      >
        <img src={playIcon} alt="" className="h-14 w-14" />
      </button>

      <button
        type="button"
        aria-label="Следующее видео"
        onClick={onNext}
        className="flex h-12 w-12 items-center justify-center rounded-full transition duration-150 ease-out hover:brightness-110 active:scale-[0.96]"
      >
        <img src={arrowRight} alt="" className="h-12 w-12" />
      </button>
    </div>
  </section>
);

const CarouselCard = forwardRef<HTMLButtonElement, CarouselCardProps>(({
  isNew,
  imageUrl,
  ariaLabel,
  onClick,
  onToggleFavorite,
  isFavorite = false,
}, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={ariaLabel}
    className="relative flex shrink-0 items-center justify-center rounded-[16px] bg-[#D9D9D9] transition duration-150 ease-out active:scale-[0.98] overflow-hidden"
    onClick={onClick}
    style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
    ) : (
      <span className="text-[12px] font-medium text-[#9C9CA3]">Нет фото</span>
    )}
    {isNew && (
      <img src={newIcon} alt="Новинка" className="absolute left-3 top-3 h-5 w-auto" />
    )}
    <div
      role="button"
      tabIndex={0}
      aria-label={isFavorite ? 'Убрать из любимых' : 'Добавить в любимые'}
      onClick={(event) => {
        event.stopPropagation();
        onToggleFavorite?.();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        onToggleFavorite?.();
      }}
      className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border ${
        isFavorite ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white/90'
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={isFavorite ? '#E11D48' : 'none'}
        stroke={isFavorite ? '#E11D48' : '#9CA3AF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l1.7 1.7L12 21l7.1-6.6 1.7-1.7a5 5 0 0 0 0-7.1Z" />
      </svg>
    </div>
  </button>
));

CarouselCard.displayName = 'CarouselCard';

const ProductCardsCarousel = () => {
  const { data, isLoading, isError } = useProductsQuery({ pageSize: 5 });
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const favorites = useFavoritesStore((state) => state.items);
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const [favoriteProduct, setFavoriteProduct] = useState<CarouselItem | null>(null);
  const [favoriteSize, setFavoriteSize] = useState('');

  const items: CarouselItem[] = useMemo(
    () =>
      (data?.items ?? []).slice(0, 3).map((product) => {
        const primaryVariant = product.variants?.[0];
        return {
          id: product.id,
          isNew: Boolean(product.is_new),
          imageUrl: product.hero_media_url || product.gallery?.[0] || null,
          tags: (product.tags ?? []).map(formatTag).filter(Boolean),
          price: primaryVariant?.price_minor_units != null ? formatPrice(primaryVariant.price_minor_units) : '—',
          ratingCount: typeof product.rating_count === 'number' ? product.rating_count.toString() : '—',
          ratingValue: typeof product.rating_value === 'number' ? product.rating_value.toFixed(1) : '—',
          defaultSize: primaryVariant?.size,
          sizes: Array.from(new Set((product.variants ?? []).map((variant) => variant.size).filter(Boolean))),
        };
      }),
    [data?.items],
  );

  const isFavorite = (productId: string) => favorites.some((item) => item.id === productId);

  const openFavoriteModal = (product: CarouselItem) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
      return;
    }
    if (!product.sizes.length) {
      toast.error('Нет доступного размера для добавления.');
      return;
    }
    setFavoriteProduct(product);
    setFavoriteSize(product.sizes[0] ?? '');
  };

  const closeFavoriteModal = () => {
    setFavoriteProduct(null);
    setFavoriteSize('');
  };

  if (isLoading) {
    return (
      <section className="px-4">
        <h2 className="mb-4 text-[21px] font-bold text-text-primary">Загружаем товары...</h2>
      </section>
    );
  }
  if (isError || items.length === 0) {
    return (
      <section className="px-4">
        <h2 className="mb-4 text-[21px] font-bold text-text-primary">Товары недоступны</h2>
      </section>
    );
  }

  return (
    <section className="px-4">
      <h2 className="mb-4 text-[21px] font-bold text-text-primary">Популярные модели</h2>
      <div
        className="w-full overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        <div className="flex items-stretch gap-6 pr-6">
          {items.map((item) => (
            <CarouselCard
              key={item.id}
              isNew={item.isNew}
              imageUrl={item.imageUrl}
              ariaLabel={`Карточка ${item.id}`}
              onClick={() => navigate(`/product/${item.id}`, { state: { from: location.pathname } })}
              onToggleFavorite={() => openFavoriteModal(item)}
              isFavorite={isFavorite(item.id)}
            />
          ))}
        </div>
      </div>
      <SizeSelectModal
        isOpen={Boolean(favoriteProduct)}
        sizes={favoriteProduct?.sizes ?? []}
        selectedSize={favoriteSize}
        onSelectSize={setFavoriteSize}
        onClose={closeFavoriteModal}
        title="Выберите размер для избранного"
        confirmLabel="Добавить в любимые"
        onConfirm={() => {
          if (!favoriteProduct || !favoriteSize) {
            toast.error('Выберите размер.');
            return;
          }
          addFavorite({
            id: favoriteProduct.id,
            tags: favoriteProduct.tags,
            price: favoriteProduct.price,
            ratingCount: favoriteProduct.ratingCount,
            ratingValue: favoriteProduct.ratingValue,
            isNew: favoriteProduct.isNew,
            imageUrl: favoriteProduct.imageUrl,
            defaultSize: favoriteProduct.defaultSize,
            size: favoriteSize,
          });
          closeFavoriteModal();
        }}
      />
    </section>
  );
};

const SizeCalculatorSection = () => {
  const [waist, setWaist] = useState<string>('');
  const [hip, setHip] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [showChecks, setShowChecks] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: calculateSize,
    onSuccess: (data) => setResult(data.size),
    onError: () => setResult(null),
  });

  const isValidMeasurement = (value: number) => Number.isInteger(value) && value >= 40 && value <= 160;
  const sanitizeNumberInput = (value: string) => value.replace(/[^\d]/g, '');

  const updateValidation = (nextWaist: string, nextHip: string) => {
    const waistNum = Number(nextWaist);
    const hipNum = Number(nextHip);
    const waistProvided = nextWaist.trim() !== '';
    const hipProvided = nextHip.trim() !== '';
    const waistValid = waistProvided && isValidMeasurement(waistNum);
    const hipValid = hipProvided && isValidMeasurement(hipNum);

    if (!waistProvided && !hipProvided) {
      setValidationError(null);
      return { waistValid, hipValid };
    }

    if (!waistValid || !hipValid) {
      setValidationError('Введите корректные значения от 40 до 160 см.');
    } else {
      setValidationError(null);
    }

    return { waistValid, hipValid };
  };

  const handleCalculate = () => {
    const { waistValid, hipValid } = updateValidation(waist, hip);
    if (!waistValid || !hipValid) {
      setResult(null);
      setShowChecks(false);
      return;
    }
    setShowChecks(true);
    mutate({ waist: Number(waist), hip: Number(hip) });
  };

  return (
    <section className="w-full bg-[#D9D9D9] px-4 py-4">
      <p className="mb-3 text-[17px] leading-[1.3] text-[#29292B]">Введите ваши данные, а мы подберем размер</p>

      <div className="flex flex-row items-start">
        <div className="basis-[60%] pr-2 flex flex-col">
          <div className="mt-4">
            <p className="mb-3 text-[22px] font-semibold text-[#29292B]">Обхват талии</p>
            <div className="mb-1 flex flex-row items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="40"
                max="160"
                step="1"
                value={waist}
                onChange={(e) => {
                  const nextValue = sanitizeNumberInput(e.target.value);
                  setWaist(nextValue);
                  setShowChecks(false);
                  setResult(null);
                  updateValidation(nextValue, hip);
                }}
                className="h-9 w-[50%] rounded-[12px] bg-white px-3 text-[12px] text-[#29292B] outline-none border-none"
              />
              {showChecks ? (
                <img src={checkIcon} alt="" className="w-6 h-6" />
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-3 text-[22px] font-semibold text-[#29292B]">Обхват бедер</p>
            <div className="mb-4 flex flex-row items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="40"
                max="160"
                step="1"
                value={hip}
                onChange={(e) => {
                  const nextValue = sanitizeNumberInput(e.target.value);
                  setHip(nextValue);
                  setShowChecks(false);
                  setResult(null);
                  updateValidation(waist, nextValue);
                }}
                className="h-9 w-[50%] rounded-[12px] bg-white px-3 text-[12px] text-[#29292B] outline-none border-none"
              />
              {showChecks ? (
                <img src={checkIcon} alt="" className="w-6 h-6" />
              ) : null}
            </div>
          </div>

          {validationError ? (
            <p className="-mt-2 mb-2 text-[11px] text-[#8B0000]">{validationError}</p>
          ) : null}

          <button
            type="button"
            className="mt-1 h-11 w-[70%] rounded-[12px] bg-[#000043] text-[17px] text-white flex items-center justify-center disabled:opacity-50"
            onClick={handleCalculate}
            disabled={isPending}
          >
            {isPending ? 'Считаем...' : '→ рассчитать'}
          </button>
        </div>

        <div className="basis-[40%] flex justify-center">
          <img src={figureBody} alt="" className="w-[120px] h-auto" />
        </div>
      </div>

      <div className="mt-0 flex flex-row items-center gap-3">
        <div className="flex flex-col text-[21px] font-bold leading-[1.1] text-[#29292B]">
          <span>Ваш размер</span>
          <span>BRACE</span>
        </div>
        <div className="h-11 w-14 rounded-[12px] bg-white flex items-center justify-center text-lg font-semibold text-[#29292B]">
          {result ?? '—'}
        </div>
        <button
          type="button"
          className="flex-1 h-11 rounded-[12px] bg-[#000043] text-[17px] text-white flex items-center justify-center"
          onClick={() => navigate('/catalog')}
        >
          → перейти в каталог
        </button>
      </div>
    </section>
  );
};

export const Homepage = () => (
  <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 text-text-primary font-montserrat">
    <HeaderHome />
    <main className="flex flex-col gap-10">
      <TitleBannerSection />
      {SHOW_VIDEO_SECTION ? (<VideoSection />) : null}
      <ProductCardsCarousel />
      <SizeCalculatorSection />
    </main>
    <AppBottomNav activeId="home" />
  </div>
);

export default Homepage;
