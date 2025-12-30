type BottomNavItem<T extends string = string> = {
  id: T;
  icon: string;
  activeIcon?: string;
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
  <nav className="fixed bottom-3 left-4 right-4 z-10 flex justify-center">
    <div className="flex h-[76px] w-full max-w-[900px] items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-lg">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => onSelect?.(item.id)}
            className="flex h-[70px] w-[70px] items-center justify-center rounded-[18px] bg-transparent transition duration-150 ease-out hover:brightness-105 active:scale-[0.97]"
          >
            <img
              src={isActive ? item.activeIcon ?? item.icon : item.icon}
              alt=""
              className="h-full w-full object-contain"
            />
          </button>
        );
      })}
    </div>
  </nav>
);
