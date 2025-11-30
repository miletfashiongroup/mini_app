type ProductTabId = 'description' | 'specs';

type ProductTabsProps = {
  activeTab: ProductTabId;
  onChange?: (tab: ProductTabId) => void;
};

const TABS: { id: ProductTabId; label: string }[] = [
  { id: 'description', label: 'описание' },
  { id: 'specs', label: 'характеристики' },
];

const ProductTabs = ({ activeTab, onChange }: ProductTabsProps) => {
  return (
    <div className="px-4 mt-4">
      <div className="flex flex-row gap-3">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={`flex h-12 w-1/2 items-center justify-center rounded-[12px] text-[15px] font-semibold lowercase transition duration-150 ease-out hover:brightness-110 active:scale-[0.95] ${
                isActive ? 'bg-[#000043] text-white' : 'bg-[#000043] text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export type { ProductTabId };
export default ProductTabs;
