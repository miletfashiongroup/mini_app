import { useEffect, useMemo, useRef, useState } from 'react';

import CatalogCategoryTabs, { CatalogTabOption } from '@/components/catalog/CatalogCategoryTabs';
import CatalogProductGrid, { CatalogProduct } from '@/components/catalog/CatalogProductGrid';
import CatalogSectionTitle from '@/components/catalog/CatalogSectionTitle';
import { PageTopBar } from '@/components/brace';
import { AppBottomNav } from '@/components/brace';
import { useProductsQuery } from '@/shared/api/queries';
import { trackEvent } from '@/shared/analytics/tracker';
import { formatTag } from '@/shared/lib/tags';

const CATEGORY_TABS: CatalogTabOption[] = [
  { id: 'Трусы', label: 'Трусы' },
  { id: 'Кальсоны', label: 'Кальсоны' },
  { id: 'Майки', label: 'Майки' },
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
  const [activeTab, setActiveTab] = useState<string>(CATEGORY_TABS[0]?.id ?? '');
  const { data, isLoading, isError } = useProductsQuery({ category: activeTab || undefined });
  const trackedCatalog = useRef(false);
  const previousTab = useRef<string>('');

  const products: CatalogProduct[] = useMemo(
    () =>
      (data?.items ?? []).map((product) => {
        const primaryVariant = product.variants?.[0];
        return {
          id: product.id,
          isNew: Boolean(product.is_new),
          tags: (product.tags ?? []).map(formatTag).filter(Boolean),
          price: formatPrice(primaryVariant?.price_minor_units),
          ratingCount: typeof product.rating_count === 'number' ? product.rating_count.toString() : '—',
          ratingValue:
            typeof product.rating_value === 'number' ? product.rating_value.toFixed(1) : '—',
          defaultSize: primaryVariant?.size,
          imageUrl: product.hero_media_url || product.gallery?.[0] || null,
          sizes: Array.from(
            new Set((product.variants ?? []).map((variant) => variant.size).filter(Boolean)),
          ),
        };
      }),
    [data?.items],
  );

  useEffect(() => {
    if (!isLoading && !isError && data?.items && !trackedCatalog.current) {
      trackEvent('catalog_view', { items_count: data.items.length, category: activeTab || null }, '/catalog');
      trackedCatalog.current = true;
    }
  }, [activeTab, data?.items, isError, isLoading]);

  const handleTabChange = (nextTab: string) => {
    const from = previousTab.current;
    if (from !== nextTab) {
      trackEvent('catalog_tab_change', { from_category: from || null, to_category: nextTab }, '/catalog');
      previousTab.current = nextTab;
    }
    setActiveTab(nextTab);
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <CatalogSectionTitle title="Каталог товаров" />
      <CatalogCategoryTabs tabs={CATEGORY_TABS} activeTab={activeTab} onChange={handleTabChange} />
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
