import { useNavigate } from 'react-router-dom';

const SizeSelectorScreen = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Выбор таблицы размеров</h1>
      <div className="space-y-3">
        <button
          onClick={() => navigate('/size-table/classic')}
          className="w-full bg-white text-black rounded-2xl py-4 text-lg font-semibold"
        >
          Классическая таблица
        </button>
        <button
          onClick={() => navigate('/size-table/extended')}
          className="w-full border border-white/20 rounded-2xl py-4 text-lg"
        >
          Развернутая таблица
        </button>
      </div>
    </section>
  );
};

export default SizeSelectorScreen;
