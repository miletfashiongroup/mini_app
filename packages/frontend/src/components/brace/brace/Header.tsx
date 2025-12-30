import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Ассортимент' },
  { to: '/size-table/men', label: 'Размеры' },
  { to: '/profile', label: 'Профиль' },
];

export const Header = () => (
  <header className="space-y-6 border-b border-brace-surface/60 pb-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brace-slate text-3xl font-black tracking-[0.3em] text-white">
          B
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-brace-neutral">brace studio</p>
          <p className="text-5xl font-bold text-brace-zinc">BRACE</p>
        </div>
      </div>
      <div className="text-right text-sm uppercase tracking-[0.4em] text-brace-neutral">
        curated products • телеграм магазин
      </div>
    </div>
    <nav className="flex flex-wrap gap-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-brace-black bg-brace-black text-white'
                : 'border-brace-surface text-brace-zinc hover:bg-brace-surface/30'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </header>
);
