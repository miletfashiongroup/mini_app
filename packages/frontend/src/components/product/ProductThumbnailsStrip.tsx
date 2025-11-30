type ProductThumbnailsStripProps = {
  thumbnailsCount?: number;
};

const ProductThumbnailsStrip = ({ thumbnailsCount = 7 }: ProductThumbnailsStripProps) => {
  return (
    <div className="px-4 mt-3">
      <div className="flex flex-row gap-2 overflow-x-auto">
        {Array.from({ length: thumbnailsCount }).map((_, index) => (
          <div key={index} className="flex-shrink-0 rounded-[12px] bg-[#D9D9D9] w-10 aspect-[232/309]" />
        ))}
      </div>
    </div>
  );
};

export default ProductThumbnailsStrip;
