import { FormEvent, useState } from 'react';

const SizeCalculator = () => {
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const w = Number(waist);
    const h = Number(hip);
    const score = (w + h) / 2;
    if (score < 80) setResult('S');
    else if (score < 90) setResult('M');
    else if (score < 100) setResult('L');
    else setResult('XL');
  };

  return (
    <div className="bg-white/5 rounded-3xl p-4 border border-white/10 space-y-4">
      <div>
        <p className="text-sm text-slate-300">Подбор размера</p>
        <h3 className="text-xl font-semibold">Подбери свой размер</h3>
      </div>
      <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-400 flex flex-col gap-1">
          Талия, см
          <input
            type="number"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-400 flex flex-col gap-1">
          Бедра, см
          <input
            type="number"
            value={hip}
            onChange={(e) => setHip(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2"
          />
        </label>
        <button className="col-span-2 bg-white text-black rounded-xl py-2 font-semibold" type="submit">
          Рассчитать
        </button>
      </form>
      {result && <p className="text-center text-sm text-slate-200">Ваш размер: {result}</p>}
    </div>
  );
};

export default SizeCalculator;
