import { useParams, useNavigate } from 'react-router-dom';

const SizeTableScreen = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const rows = [
    { size: 'S', waist: '70-78', hip: '86-94', length: '28' },
    { size: 'M', waist: '79-85', hip: '95-101', length: '29' },
    { size: 'L', waist: '86-93', hip: '102-108', length: '30' },
    { size: 'XL', waist: '94-101', hip: '109-115', length: '31' },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-300">← Назад</button>
        <h1 className="text-2xl font-semibold">
          {type === 'extended' ? 'Развернутая таблица' : 'Классическая таблица'}
        </h1>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="p-3">Размер</th>
              <th className="p-3">Талия, см</th>
              <th className="p-3">Бедра, см</th>
              <th className="p-3">Длина по внутреннему шву</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} className="border-t border-white/5">
                <td className="p-3">{row.size}</td>
                <td className="p-3">{row.waist}</td>
                <td className="p-3">{row.hip}</td>
                <td className="p-3">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SizeTableScreen;
