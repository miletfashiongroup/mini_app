import { useState } from 'react';

import CatalogCategoryTabs, { CatalogTabOption } from '@/components/catalog/CatalogCategoryTabs';
import CatalogHeader from '@/components/catalog/CatalogHeader';
import CatalogSectionTitle from '@/components/catalog/CatalogSectionTitle';
import CatalogProductGrid, { CatalogProduct } from '@/components/catalog/CatalogProductGrid';
import CatalogTopStatusBar from '@/components/catalog/CatalogTopStatusBar';
import CatalogBottomNavigation from '@/components/catalog/CatalogBottomNavigation';
import logoBrace from '@/assets/images/logo-brace.svg';

const CATEGORY_TABS: CatalogTabOption[] = [
  { id: 'trunks', label: 'Трусы' },
  { id: 'longjohns', label: 'Кальсоны' },
  { id: 'tees', label: 'Майки' },
];

const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    id: 'product-1',
    isNew: true,
    tags: ['#семейные', '#4_шт.', '#100%_хлопок'],
    price: '1 591 ₽',
    ratingCount: '11 794',
    ratingValue: '4,9',
  },
  {
    id: 'product-2',
    isNew: true,
    tags: ['#семейные', '#4_шт.', '#100%_хлопок'],
    price: '1 591 ₽',
    ratingCount: '11 794',
    ratingValue: '4,9',
  },
];

export const CatalogPage = () => {
  const [activeTab, setActiveTab] = useState<string>('');

  return (
    <div className="min-h-screen bg-white pb-28 font-montserrat text-[#29292B]">
      <CatalogTopStatusBar />
      <CatalogHeader logoSrc={logoBrace} />
      <CatalogSectionTitle title="Заголовок 2.1" />
      <CatalogCategoryTabs tabs={CATEGORY_TABS} activeTab={activeTab} onChange={setActiveTab} />
      <CatalogProductGrid products={MOCK_PRODUCTS} />
      <CatalogBottomNavigation activeId="home" />
    </div>
  );
};
