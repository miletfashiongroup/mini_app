export const formatPoints = (value?: number | null) => {
  const safe = Math.max(0, Number(value ?? 0));
  return safe.toLocaleString('ru-RU');
};
