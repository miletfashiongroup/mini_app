import bagIcon from '@/assets/images/icon-bag.svg';
import cartIcon from '@/assets/images/icon-cart.svg';
import homeIcon from '@/assets/images/icon-home.svg';
import profileIcon from '@/assets/images/icon-profile.svg';
import { useNavigate } from 'react-router-dom';

import { BottomNavigation } from '@/shared/ui/BottomNavigation';

export type AppNavId = 'home' | 'bag' | 'cart' | 'profile';

const NAV_ITEMS: { id: AppNavId; icon: string; label: string }[] = [
  { id: 'home', icon: homeIcon, label: 'Домой' },
  { id: 'bag', icon: bagIcon, label: 'Сумка' },
  { id: 'cart', icon: cartIcon, label: 'Корзина' },
  { id: 'profile', icon: profileIcon, label: 'Профиль' },
];

const DEFAULT_ROUTES: Record<AppNavId, string> = {
  home: '/',
  bag: '/catalog',
  cart: '/cart',
  profile: '/profile',
};

type Props = {
  activeId?: AppNavId;
  onSelect?: (id: AppNavId) => void;
};

export const AppBottomNav = ({ activeId, onSelect }: Props) => {
  const navigate = useNavigate();

  const handleSelect = (id: AppNavId) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    const target = DEFAULT_ROUTES[id] ?? '/';
    navigate(target);
  };

  return <BottomNavigation<AppNavId> items={NAV_ITEMS} activeId={activeId} onSelect={handleSelect} />;
};
