import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const calculatorSchema = z.object({
  waist: z
    .coerce.number({ invalid_type_error: 'Введите число' })
    .min(60, 'Минимум 60 см')
    .max(140, 'Максимум 140 см'),
  hips: z
    .coerce.number({ invalid_type_error: 'Введите число' })
    .min(80, 'Минимум 80 см')
    .max(150, 'Максимум 150 см'),
});

type CalculatorForm = z.infer<typeof calculatorSchema>;

const SIZE_TABLE = [
  { size: '1', waist: [74, 78], hip: [92, 96] },
  { size: '2', waist: [78, 82], hip: [96, 109] },
  { size: '3', waist: [82, 86], hip: [100, 104] },
  { size: '4', waist: [86, 90], hip: [104, 108] },
  { size: '5', waist: [90, 94], hip: [108, 112] },
  { size: '6', waist: [94, 98], hip: [112, 116] },
  { size: '7', waist: [98, 103], hip: [116, 120] },
  { size: '8', waist: [103, 107], hip: [120, 124] },
  { size: '9', waist: [107, 112], hip: [124, 128] },
  { size: '10', waist: [112, 117], hip: [128, 132] },
  { size: '11', waist: [117, 121], hip: [132, 136] },
  { size: '12', waist: [121, 126], hip: [136, 140] },
  { size: '13', waist: [126, 130], hip: [140, 144] },
  { size: '14', waist: [130, 134], hip: [144, 148] },
];

const matchIndex = (value: number, key: 'waist' | 'hip') => {
  let match: number | null = null;
  SIZE_TABLE.forEach((row, index) => {
    const [minVal, maxVal] = row[key];
    if (value >= minVal && value <= maxVal) {
      match = index;
    }
  });
  return match;
};

const calcSize = (waist: number, hips: number) => {
  const waistIndex = matchIndex(waist, 'waist');
  const hipIndex = matchIndex(hips, 'hip');

  if (waistIndex !== null && hipIndex !== null) {
    return SIZE_TABLE[Math.max(waistIndex, hipIndex)].size;
  }
  if (waistIndex !== null) return SIZE_TABLE[waistIndex].size;
  if (hipIndex !== null) return SIZE_TABLE[hipIndex].size;
  if (waist <= SIZE_TABLE[0].waist[0] || hips <= SIZE_TABLE[0].hip[0]) return SIZE_TABLE[0].size;
  if (waist >= SIZE_TABLE[SIZE_TABLE.length - 1].waist[1] || hips >= SIZE_TABLE[SIZE_TABLE.length - 1].hip[1])
    return SIZE_TABLE[SIZE_TABLE.length - 1].size;
  return SIZE_TABLE[SIZE_TABLE.length - 1].size;
};

export const SizeCalculator = () => {
  const [result, setResult] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: { waist: 80, hips: 95 },
  });

  const errorMessage = useMemo(
    () => errors.waist?.message ?? errors.hips?.message ?? null,
    [errors],
  );

  const onSubmit = (values: CalculatorForm) => {
    setResult(calcSize(values.waist, values.hips));
  };

  return (
    <div className="bg-white/5 rounded-3xl p-4 border border-white/10 space-y-4">
      <div>
        <p className="text-sm text-slate-300">Подбор размера</p>
        <h3 className="text-xl font-semibold">Подбери свой размер</h3>
      </div>
      <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="text-sm text-slate-400 flex flex-col gap-1">
          Талия, см
          <input
            type="number"
            {...register('waist', { valueAsNumber: true })}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-400 flex flex-col gap-1">
          Бедра, см
          <input
            type="number"
            {...register('hips', { valueAsNumber: true })}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2"
          />
        </label>
        {errorMessage && (
          <p className="col-span-2 text-xs text-red-300 bg-red-500/10 rounded-xl px-3 py-2">
            {errorMessage}
          </p>
        )}
        <button className="col-span-2 bg-white text-black rounded-xl py-2 font-semibold" type="submit">
          Рассчитать
        </button>
      </form>
      {result && <p className="text-center text-sm text-slate-200">Ваш размер: {result}</p>}
    </div>
  );
};
