import { Link } from 'react-router-dom';
import useProfile from '../hooks/useProfile';

const sections = [
  { label: 'Мои заказы', path: '/coming-soon' },
  { label: 'Мой аккаунт', path: '/coming-soon' },
  { label: 'Бонусная система', path: '/coming-soon' },
  { label: 'Реферальная система', path: '/coming-soon' },
  { label: 'Поддержка', path: '/coming-soon' },
  { label: 'Юридические документы', path: '/legal/privacy' },
];

const ProfileScreen = () => {
  const { data } = useProfile();

  return (
    <section className="space-y-4">
      <div className="bg-white/5 rounded-3xl p-5 space-y-2">
        <p className="text-sm text-slate-400">Telegram профиль</p>
        <h1 className="text-2xl font-semibold">{data?.first_name}</h1>
        <p className="text-sm text-slate-400">@{data?.username}</p>
        <p className="text-xs text-slate-500">ID: {data?.telegram_id}</p>
      </div>
      <div className="bg-white/5 rounded-3xl divide-y divide-white/5">
        {sections.map((section) => (
          <Link key={section.label} to={section.path} className="flex justify-between p-4 text-sm">
            <span>{section.label}</span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ProfileScreen;
