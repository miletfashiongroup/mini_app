import { useMemo, useState } from 'react';

import CatalogCategoryTabs, { CatalogTabOption } from '@/components/catalog/CatalogCategoryTabs';
import CatalogProductGrid, { CatalogProduct } from '@/components/catalog/CatalogProductGrid';
import CatalogSectionTitle from '@/components/catalog/CatalogSectionTitle';
import { PageTopBar } from '@/components/brace';
import { AppBottomNav } from '@/components/brace';
import { useProductsQuery } from '@/shared/api/queries';

const CATEGORY_TABS: CatalogTabOption[] = [
  { id: 'trunks', label: 'Трусы' },
  { id: 'longjohns', label: 'Кальсоны' },
  { id: 'tees', label: 'Майки' },
];

const rubleFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatPrice = (minorUnits?: number) =>
  typeof minorUnits === 'number' ? rubleFormatter.format(minorUnits / 100) : '—';

export const CatalogPage = () => {
  const { data, isLoading, isError } = useProductsQuery();
  const [activeTab, setActiveTab] = useState<string>('');

  const products: CatalogProduct[] = useMemo(
    () =>
      (data?.items ?? []).map((product) => {
        const primaryVariant = product.variants?.[0];
        return {
          id: product.id,
          isNew: Boolean(product.is_new),
          tags: (product.tags ?? []).map((tag: string) => `#${tag}`),
          price: formatPrice(primaryVariant?.price_minor_units),
          ratingCount: typeof product.rating_count === 'number' ? product.rating_count.toString() : '—',
          ratingValue:
            typeof product.rating_value === 'number' ? product.rating_value.toFixed(1) : '—',
          defaultSize: primaryVariant?.size,
        };
      }),
    [data?.items],
  );

  return (
    <div className="min-h-screen bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <CatalogSectionTitle title="Заголовок 2.1" />
      <CatalogCategoryTabs tabs={CATEGORY_TABS} activeTab={activeTab} onChange={setActiveTab} />
      {isLoading ? (
        <p className="px-4 text-[14px]">Загружаем каталог...</p>
      ) : isError ? (
        <p className="px-4 text-[14px]">Не удалось загрузить каталог.</p>
      ) : (
        <CatalogProductGrid products={products} />
      )}
      <AppBottomNav activeId="bag" />
    </div>
  );
};
