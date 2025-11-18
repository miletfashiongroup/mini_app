const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});
// PRINCIPAL-NOTE: Centralized formatting keeps UI/precision consistent across widgets.

export const formatPrice = (priceMinorUnits: number): string => rubFormatter.format(priceMinorUnits / 100);
