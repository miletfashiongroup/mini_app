import { NavLink } from 'react-router-dom';
import { HomeIcon, ShoppingBagIcon, UserIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const tabs = [
  { to: '/', label: 'Главная', icon: HomeIcon },
  { to: '/catalog', label: 'Каталог', icon: ShoppingBagIcon },
  { to: '/cart', label: 'Корзина', icon: ShoppingCartIcon },
  { to: '/profile', label: 'Профиль', icon: UserIcon }
];

const TabBar = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur border-t border-white/10 flex text-xs">
    {tabs.map((tab) => (
      <NavLink
        key={tab.to}
        to={tab.to}
        className={({ isActive }) =>
          `flex flex-1 flex-col gap-1 items-center py-2 ${isActive ? 'text-white' : 'text-slate-400'}`
        }
      >
        <tab.icon className="h-5 w-5" />
        {tab.label}
      </NavLink>
    ))}
  </nav>
);

export default TabBar;
