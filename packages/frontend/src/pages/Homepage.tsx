import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import figureBody from '@/assets/images/figure-body.svg';
import arrowLeft from '@/assets/images/icon-arrow-left.svg';
import arrowRight from '@/assets/images/icon-arrow-right.svg';
import cartIcon from '@/assets/images/icon-cart.svg';
import checkIcon from '@/assets/images/icon-check.svg';
import newIcon from '@/assets/images/icon-new.svg';
import playIcon from '@/assets/images/icon-play.svg';
import logoBrace from '@/assets/images/logo-brace.svg';
import { AppBottomNav } from '@/components/brace';
import { calculateSize } from '@/features/size-calculator/api/sizeCalcApi';
import { useBannersQuery, useProductsQuery } from '@/shared/api/queries';

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
  ariaLabel: string;
  onClick?: () => void;
};

type CarouselItem = {
  id: string;
  isNew?: boolean;
};

const CARD_WIDTH = 232;
const CARD_HEIGHT = 309;
const GAP_PX = 24;

const HeaderHome = () => (
  <header className="px-4 py-6">
    <img src={logoBrace} alt="Логотип BRACE" className="h-10 w-auto" />
  </header>
);

const BannerPlaceholder = ({ children }: { children?: React.ReactNode }) => (
  <div
    className="relative flex w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#D9D9D9]"
    style={{ aspectRatio: '1.7 / 1', minHeight: '210px' }}
  >
    <span className="text-[16px] font-semibold text-[#BABABA]">Баннер</span>
    {children ? <div className="absolute bottom-3 left-0 right-0">{children}</div> : null}
  </div>
);

const BannerCarousel = () => {
  const { data, isLoading, isError } = useBannersQuery();
  const [activeIndex, setActiveIndex] = useState(0);
  const banners = data?.banners ?? [];

  useEffect(() => {
    setActiveIndex(data?.active_index ?? 0);
  }, [data?.active_index]);

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

  return (
    <div className="relative">
      <BannerPlaceholder>
        {activeBanner?.image_url ? (
          <img
            src={activeBanner.image_url}
            alt="Баннер"
            className="block h-full w-full object-cover"
            style={{ borderRadius: 16, maxHeight: 320 }}
          />
        ) : null}
        <BannerIndicators
          count={banners.length}
          activeIndex={activeIndex}
          onSelect={(index) => setActiveIndex(index)}
          className="mt-0"
        />
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
    <h2 className="text-[21px] font-bold text-text-primary">Заголовок 1.1</h2>
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

const CarouselCard = forwardRef<HTMLButtonElement, CarouselCardProps>(({ isNew, ariaLabel, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={ariaLabel}
    className="relative flex shrink-0 items-center justify-center rounded-[16px] bg-[#D9D9D9] transition duration-150 ease-out active:scale-[0.98]"
    onClick={onClick}
    style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
  >
    {isNew && (
      <img src={newIcon} alt="Новинка" className="absolute left-3 top-3 h-5 w-auto" />
    )}
    <img src={cartIcon} alt="Иконка корзины" className="absolute right-3 top-3 h-4 w-4" />
  </button>
));

CarouselCard.displayName = 'CarouselCard';

const ProductCardsCarousel = () => {
  const { data, isLoading, isError } = useProductsQuery({ pageSize: 5 });
  const items: CarouselItem[] = useMemo(
    () => (data?.items ?? []).slice(0, 3).map((product) => ({ id: product.id, isNew: Boolean(product.is_new) })),
    [data?.items],
  );
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => setContainerWidth(containerRef.current?.clientWidth ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const translateX = useMemo(() => {
    if (!containerWidth) return 0;
    const base = (containerWidth - CARD_WIDTH) / 2;
    return base - currentIndex * (CARD_WIDTH + GAP_PX);
  }, [containerWidth, currentIndex]);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, items.length - 1));

  const handleTouchStart = (event: ReactTouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: ReactTouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0]?.clientX - touchStartX.current;
    if (deltaX > 30) handlePrev();
    else if (deltaX < -30) handleNext();
    touchStartX.current = null;
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
      <h2 className="mb-4 text-[21px] font-bold text-text-primary">Заголовок 1.2</h2>
      <div className="overflow-hidden w-full" ref={containerRef}>
        <div
          className="flex items-stretch gap-6 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${translateX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {items.map((item) => (
            <CarouselCard
              key={item.id}
              isNew={item.isNew}
              ariaLabel={`Карточка ${item.id}`}
              onClick={() => navigate(`/product/${item.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const SizeCalculatorSection = () => {
  const [waist, setWaist] = useState<string>('');
  const [hip, setHip] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: calculateSize,
    onSuccess: (data) => setResult(data.size),
    onError: () => setResult(null),
  });

  const handleCalculate = () => {
    const waistNum = Number(waist);
    const hipNum = Number(hip);
    if (!waistNum || !hipNum) {
      setResult(null);
      return;
    }
    mutate({ waist: waistNum, hip: hipNum });
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
                inputMode="decimal"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="h-9 w-[50%] rounded-[12px] bg-white px-3 text-[12px] text-[#29292B] outline-none border-none"
              />
              <img src={checkIcon} alt="" className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-3 text-[22px] font-semibold text-[#29292B]">Обхват бедер</p>
            <div className="mb-4 flex flex-row items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                className="h-9 w-[50%] rounded-[12px] bg-white px-3 text-[12px] text-[#29292B] outline-none border-none"
              />
              <img src={checkIcon} alt="" className="w-6 h-6" />
            </div>
          </div>

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
      <VideoSection />
      <ProductCardsCarousel />
      <SizeCalculatorSection />
    </main>
    <AppBottomNav activeId="home" />
  </div>
);

export default Homepage;
