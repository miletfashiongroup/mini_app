import bagIcon from '@/assets/images/icon-bag.svg';
import cartIcon from '@/assets/images/icon-cart.svg';
import homeIcon from '@/assets/images/icon-home.svg';
import profileIcon from '@/assets/images/icon-profile.svg';

type CatalogBottomNavigationProps = {
  activeId?: 'home' | 'bag' | 'cart' | 'profile';
  onSelect?: (id: 'home' | 'bag' | 'cart' | 'profile') => void;
};

const NAV_ITEMS: { id: CatalogBottomNavigationProps['activeId']; icon: string; label: string }[] = [
  { id: 'home', icon: homeIcon, label: 'Домой' },
  { id: 'bag', icon: bagIcon, label: 'Сумка' },
  { id: 'cart', icon: cartIcon, label: 'Корзина' },
  { id: 'profile', icon: profileIcon, label: 'Профиль' },
];

const CatalogBottomNavigation = ({ activeId, onSelect }: CatalogBottomNavigationProps) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-10 h-[88px] rounded-2xl bg-[#D9D9D9] px-4 py-3">
      <div className="flex h-full items-center justify-between">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => onSelect?.(item.id!)}
              className={`flex h-16 w-16 items-center justify-center rounded-[16px] bg-white transition duration-150 ease-out hover:brightness-105 active:scale-[0.97] ${
                isActive ? 'ring-1 ring-[#29292B]/20' : ''
              }`}
            >
              <img src={item.icon} alt="" className="h-10 w-10" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CatalogBottomNavigation;
