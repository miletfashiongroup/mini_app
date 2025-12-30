import cartActiveIcon from '@/assets/images/cart_act.png';
import cartInactiveIcon from '@/assets/images/cart_deact_new.png';
import catalogActiveIcon from '@/assets/images/catalog_act.png';
import catalogInactiveIcon from '@/assets/images/catalog_deact_new.png';
import homeActiveIcon from '@/assets/images/home_act.png';
import homeInactiveIcon from '@/assets/images/home_deact_new.png';
import profileActiveIcon from '@/assets/images/profile_act.png';
import profileInactiveIcon from '@/assets/images/profile_deact_new.png';
import { useNavigate } from 'react-router-dom';

import { BottomNavigation } from '@/shared/ui/BottomNavigation';

export type AppNavId = 'home' | 'bag' | 'cart' | 'profile';

const NAV_ITEMS: { id: AppNavId; icon: string; activeIcon: string; label: string }[] = [
  { id: 'home', icon: homeInactiveIcon, activeIcon: homeActiveIcon, label: 'Домой' },
  { id: 'bag', icon: catalogInactiveIcon, activeIcon: catalogActiveIcon, label: 'Сумка' },
  { id: 'cart', icon: cartInactiveIcon, activeIcon: cartActiveIcon, label: 'Корзина' },
  { id: 'profile', icon: profileInactiveIcon, activeIcon: profileActiveIcon, label: 'Профиль' },
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
