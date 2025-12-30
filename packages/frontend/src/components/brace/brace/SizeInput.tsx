import type { ChangeEvent } from 'react';

interface Props {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export const SizeInput = ({ id, label, value, suffix = 'см', onChange, error }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="text-sm font-medium uppercase tracking-[0.3em] text-brace-neutral">{label}</span>
      <div className={`flex items-center rounded-brace border px-4 py-3 text-lg ${error ? 'border-brace-red600 bg-brace-red300/10' : 'border-brace-surface bg-white/80'}`}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          className="w-full bg-transparent text-2xl font-semibold text-brace-zinc outline-none"
          placeholder="0"
        />
        <span className="text-sm uppercase tracking-[0.3em] text-brace-neutral">{suffix}</span>
      </div>
      {error && <span className="text-sm text-brace-red600">{error}</span>}
    </label>
  );
};
