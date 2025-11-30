type ProductMediaCarouselProps = {
  itemsCount?: number;
};

const ProductMediaCarousel = ({ itemsCount = 3 }: ProductMediaCarouselProps) => {
  return (
    <div className="px-4">
      <div className="flex flex-row gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: itemsCount }).map((_, index) => (
          <div
            key={index}
            className="flex-shrink-0 rounded-[16px] bg-[#D9D9D9] w-[48%] max-w-[170px] min-w-[150px] aspect-[232/309]"
          />
        ))}
      </div>
    </div>
  );
};

export default ProductMediaCarousel;
