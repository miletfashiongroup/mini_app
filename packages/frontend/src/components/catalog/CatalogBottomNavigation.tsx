import bagIcon from '@/assets/images/icon-bag.svg';
import cartIcon from '@/assets/images/icon-cart.svg';
import homeIcon from '@/assets/images/icon-home.svg';
import profileIcon from '@/assets/images/icon-profile.svg';
import { useNavigate } from 'react-router-dom';

import { BottomNavigation } from '@/shared/ui/BottomNavigation';

type CatalogNavId = 'home' | 'bag' | 'cart' | 'profile';

type CatalogBottomNavigationProps = {
  activeId?: CatalogNavId;
  onSelect?: (id: CatalogNavId) => void;
};

const NAV_ITEMS: { id: CatalogNavId; icon: string; label: string }[] = [
  { id: 'home', icon: homeIcon, label: 'Домой' },
  { id: 'bag', icon: bagIcon, label: 'Сумка' },
  { id: 'cart', icon: cartIcon, label: 'Корзина' },
  { id: 'profile', icon: profileIcon, label: 'Профиль' },
];

const DEFAULT_ROUTES: Record<CatalogNavId, string> = {
  home: '/',
  bag: '/catalog',
  cart: '/cart',
  profile: '/profile',
};

const CatalogBottomNavigation = ({ activeId, onSelect }: CatalogBottomNavigationProps) => {
  const navigate = useNavigate();

  const handleSelect = (id: CatalogNavId) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    const target = DEFAULT_ROUTES[id] ?? '/';
    navigate(target);
  };

  return <BottomNavigation<CatalogNavId> items={NAV_ITEMS} activeId={activeId} onSelect={handleSelect} />;
};

export default CatalogBottomNavigation;
