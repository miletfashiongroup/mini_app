import { useMemo, useState } from 'react';

import { Badge } from './Badge';
import { SizeInput } from './SizeInput';

type Variant = 'default' | 'compact';

type Props = {
  variant?: Variant;
};

const sizeChart = [
  { size: 'XS', waist: [58, 65], hips: [84, 91] },
  { size: 'S', waist: [66, 73], hips: [92, 99] },
  { size: 'M', waist: [74, 81], hips: [100, 107] },
  { size: 'L', waist: [82, 89], hips: [108, 115] },
  { size: 'XL', waist: [90, 97], hips: [116, 123] },
];

export const SizeCalculator = ({ variant = 'default' }: Props) => {
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  const recommendation = useMemo(() => {
    const waistValue = Number(waist);
    const hipsValue = Number(hips);
    if (!waistValue || !hipsValue) {
      return null;
    }
    return (
      sizeChart.find(
        (row) =>
          waistValue >= row.waist[0] &&
          waistValue <= row.waist[1] &&
          hipsValue >= row.hips[0] &&
          hipsValue <= row.hips[1],
      ) ?? null
    );
  }, [hips, waist]);

  const containerClasses = variant === 'compact'
    ? 'rounded-3xl border border-brace-surface bg-white/70 p-5 space-y-4'
    : 'rounded-3xl border border-brace-surface bg-white/80 p-8 space-y-6';

  return (
    <section className={containerClasses}>
      <div className="space-y-2">
        <Badge color="bg-accent">ваш размер</Badge>
        <h3 className="text-heading font-bold text-brace-zinc">Калькулятор размеров</h3>
        <p className="text-lg text-brace-neutral">Введите мерки талии и бедер, чтобы получить рекомендацию BRACE.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SizeInput id="waist" label="Обхват талии" value={waist} onChange={setWaist} />
        <SizeInput id="hips" label="Обхват бедер" value={hips} onChange={setHips} />
      </div>
      <div className="rounded-3xl bg-brace-black/90 px-6 py-5 text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-white/70">Ваш размер BRACE</p>
        <p className="text-display font-bold">
          {recommendation?.size ?? '--'}
        </p>
        <p className="text-sm text-white/80">
          {recommendation
            ? `Талия ${recommendation.waist[0]}-${recommendation.waist[1]} см • Бедра ${recommendation.hips[0]}-${recommendation.hips[1]} см`
            : 'Введите мерки чтобы получить рекомендацию.'}
        </p>
      </div>
    </section>
  );
};
