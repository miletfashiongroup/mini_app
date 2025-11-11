import { useNavigate } from 'react-router-dom';

const PlaceholderScreen = () => {
  const navigate = useNavigate();
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Страница в разработке</h1>
      <p className="text-slate-300">
        Мы запускаем новый опыт. Совсем скоро вы сможете управлять заказами, бонусами и рефералами.
      </p>
      <button onClick={() => navigate('/')} className="bg-white text-black rounded-2xl py-3 px-6 font-semibold">
        Вернуться в главное меню
      </button>
    </section>
  );
};

export default PlaceholderScreen;
