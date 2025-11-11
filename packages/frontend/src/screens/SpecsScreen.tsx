import { useNavigate } from 'react-router-dom';

const specs = [
  { label: 'Ткань', value: 'Микромодал + эластан' },
  { label: 'Состав', value: '92% микромодал, 8% эластан' },
  { label: 'Плотность', value: '180 г/м²' },
  { label: 'Уход', value: '30°C деликатная стирка, без отбеливателей' },
];

const SpecsScreen = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-slate-300">← Назад</button>
      <h1 className="text-2xl font-semibold">Характеристики</h1>
      <div className="bg-white/5 rounded-3xl divide-y divide-white/5">
        {specs.map((spec) => (
          <div key={spec.label} className="p-4 flex justify-between text-sm">
            <span className="text-slate-400">{spec.label}</span>
            <span>{spec.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpecsScreen;
