export type CatalogTabOption = {
  id: string;
  label: string;
};

type CatalogCategoryTabsProps = {
  tabs: CatalogTabOption[];
  activeTab: string;
  onChange: (id: string) => void;
};

const CatalogCategoryTabs = ({ tabs, activeTab, onChange }: CatalogCategoryTabsProps) => {
  return (
    <div className="px-4 mt-4">
      <div className="flex flex-row gap-3">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`h-11 px-5 rounded-full text-base font-semibold transition duration-150 active:scale-[0.97] ${
                isActive
                  ? 'bg-[#000043] text-white'
                  : 'bg-[#F3F3F7] text-[#29292B] hover:bg-[#e9e9ef]'
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

export default CatalogCategoryTabs;
