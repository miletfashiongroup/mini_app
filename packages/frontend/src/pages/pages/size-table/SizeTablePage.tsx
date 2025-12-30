import { useParams } from 'react-router-dom';

import { BackButton } from '@/components/brace';

const rows = [
  { size: 'S', waist: '70-78', hip: '86-94', length: '28' },
  { size: 'M', waist: '79-85', hip: '95-101', length: '29' },
  { size: 'L', waist: '86-93', hip: '102-108', length: '30' },
  { size: 'XL', waist: '94-101', hip: '109-115', length: '31' },
];

export const SizeTablePage = () => {
  const { type } = useParams();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
      <div className="px-4 pt-6">
        <BackButton iconOnly fallbackTo="/catalog" />
      </div>
      <section className="space-y-4 px-4 pt-4">
        <h1 className="text-2xl font-semibold">
          {type === 'extended' ? 'Развернутая таблица' : 'Классическая таблица'}
        </h1>
        <div className="overflow-x-auto rounded-2xl border border-[#E6E6E9] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-[#5A5A5C] bg-[#F2F2F6]">
                <th className="p-3">Размер</th>
                <th className="p-3">Талия, см</th>
                <th className="p-3">Бедра, см</th>
                <th className="p-3">Длина по внутреннему шву</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.size} className="border-t border-[#EFEFF2]">
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
    </div>
  );
};
