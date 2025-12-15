type BottomNavItem<T extends string = string> = {
  id: T;
  icon: string;
  label: string;
};

type BottomNavigationProps<T extends string = string> = {
  items: BottomNavItem<T>[];
  activeId?: T;
  onSelect?: (id: T) => void;
};

export const BottomNavigation = <T extends string = string>({
  items,
  activeId,
  onSelect,
}: BottomNavigationProps<T>) => (
  <nav className="fixed bottom-4 left-1/2 z-10 w-[calc(100%-32px)] max-w-[1000px] -translate-x-1/2">
    <div className="flex h-[88px] w-full items-center justify-between rounded-2xl bg-gray-100 px-4 py-3 shadow-subtle">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => onSelect?.(item.id)}
            className={`flex h-16 w-16 items-center justify-center rounded-[16px] bg-white transition duration-150 ease-out hover:brightness-105 active:scale-[0.97] ${
              isActive ? 'ring-1 ring-text-primary/20' : ''
            }`}
          >
            <img src={item.icon} alt="" className="h-10 w-10" />
          </button>
        );
      })}
    </div>
  </nav>
);
