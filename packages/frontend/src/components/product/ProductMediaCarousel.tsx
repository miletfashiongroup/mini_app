import { forwardRef, useEffect, useMemo, useRef, useImperativeHandle } from 'react';

export type ProductMediaCarouselHandle = {
  scrollTo: (index: number) => void;
};

type ProductMediaCarouselProps = {
  items?: string[];
  activeIndex?: number;
  onChangeIndex?: (index: number) => void;
  onImageClick?: (index: number) => void;
};

const ProductMediaCarousel = forwardRef<ProductMediaCarouselHandle, ProductMediaCarouselProps>(
  ({ items = [], activeIndex = 0, onChangeIndex, onImageClick }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gapPx = 12;
  const visibleItems = 1.5;
  const programmaticScroll = useRef(false);
  const scrollRaf = useRef<number | null>(null);

  const totalItems = items.length;
  const safeIndex = totalItems ? Math.min(activeIndex, totalItems - 1) : 0;

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    const target = itemRefs.current[index];
    if (!container || !target) return;
    programmaticScroll.current = true;
    container.scrollTo({ left: target.offsetLeft, behavior });
    window.setTimeout(() => {
      programmaticScroll.current = false;
    }, behavior === 'smooth' ? 350 : 0);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || !totalItems) return;
    if (programmaticScroll.current) {
      return;
    }
    if (scrollRaf.current) {
      cancelAnimationFrame(scrollRaf.current);
    }
    scrollRaf.current = requestAnimationFrame(() => {
      const first = itemRefs.current[0];
      if (!first) return;
      const itemWidth = first.clientWidth;
      const stride = itemWidth + gapPx;
      const index = Math.max(0, Math.min(totalItems - 1, Math.round(container.scrollLeft / stride)));
      if (index !== safeIndex) {
        onChangeIndex?.(index);
      }
    });
  };

  useEffect(() => {
    if (!totalItems) return;
    scrollToIndex(safeIndex, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems]);

  useEffect(() => {
    if (!totalItems) return;
    scrollToIndex(safeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, totalItems]);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (index: number) => scrollToIndex(index),
    }),
    [],
  );

  const content = useMemo(() => {
    if (!items.length) {
      return (
        <div
          className="flex-shrink-0 rounded-[16px] bg-[#D9D9D9] aspect-[232/309]"
          style={{ width: `calc((100% - ${gapPx}px) / ${visibleItems})` }}
        />
      );
    }
    return items.map((url, index) => (
      <div
        key={`${url}-${index}`}
        ref={(node) => {
          itemRefs.current[index] = node;
        }}
        className="flex-shrink-0 rounded-[16px] bg-[#F3F3F7] aspect-[232/309] overflow-hidden snap-start"
        style={{ width: `calc((100% - ${gapPx}px) / ${visibleItems})` }}
      >
        <button
          type="button"
          className="h-full w-full"
          onClick={() => onImageClick?.(index)}
          aria-label="Открыть фото товара"
        >
          <img src={url} alt="" className="h-full w-full object-cover" />
        </button>
      </div>
    ));
  }, [items]);

  return (
    <div className="px-4">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-row gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: 0 }}
      >
        {content}
      </div>
    </div>
  );
});

ProductMediaCarousel.displayName = 'ProductMediaCarousel';

export default ProductMediaCarousel;
