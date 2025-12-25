import { useEffect, useRef } from 'react';

type ProductThumbnailsStripProps = {
  items?: string[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
};

const ProductThumbnailsStrip = ({
  items = [],
  activeIndex = 0,
  onSelect,
}: ProductThumbnailsStripProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const target = itemRefs.current[activeIndex];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="px-4 mt-3">
      <div
        ref={containerRef}
        className="flex flex-row gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((url, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`${url}-${index}`}
              type="button"
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              onClick={() => onSelect?.(index)}
              className={`flex-shrink-0 rounded-[12px] bg-[#F3F3F7] w-12 aspect-[4/5] overflow-hidden border transition ${
                isActive ? 'border-[#000043]' : 'border-transparent'
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductThumbnailsStrip;
