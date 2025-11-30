type ProductSizeOption = {
  id: string;
  label: string;
  subLabel?: string;
};

type ProductSizeSelectorProps = {
  options: ProductSizeOption[];
  activeId?: string;
  onSelect?: (id: string) => void;
};

const ProductSizeSelector = ({ options, activeId, onSelect }: ProductSizeSelectorProps) => {
  return (
    <div className="px-4 mt-5">
      <div className="flex flex-row gap-3 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const isActive = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect?.(option.id)}
              className={`flex h-10 flex-col items-center justify-center rounded-[12px] px-5 leading-tight text-[#29292B] text-[13px] font-semibold transition duration-150 ease-out active:scale-[0.95] ${
                isActive
                  ? 'border-[1.5px] border-[#000043] bg-white'
                  : 'border border-[#E5E5E5] bg-white'
              }`}
            >
              <span className="text-[15px]">{option.label}</span>
              {option.subLabel && (
                <span className="text-[12px] font-medium opacity-90">{option.subLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export type { ProductSizeOption };
export default ProductSizeSelector;
