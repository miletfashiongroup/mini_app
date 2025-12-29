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
  <nav className="fixed bottom-3 left-0 right-0 z-10 flex justify-center">
    <div className="flex h-[68px] w-full max-w-[960px] items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-lg">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => onSelect?.(item.id)}
            className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/80 transition duration-150 ease-out hover:brightness-105 active:scale-[0.97] ${
              isActive ? 'ring-1 ring-text-primary/20' : ''
            }`}
          >
            <img src={item.icon} alt="" className="h-7 w-7" />
          </button>
        );
      })}
    </div>
  </nav>
);
