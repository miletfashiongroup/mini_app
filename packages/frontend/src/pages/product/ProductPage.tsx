import { useState } from 'react';

import ProductBottomBar from '@/components/product/ProductBottomBar';
import ProductComplementSection from '@/components/product/ProductComplementSection';
import ProductHeader from '@/components/product/ProductHeader';
import ProductMediaCarousel from '@/components/product/ProductMediaCarousel';
import ProductPriceAndSizeSection from '@/components/product/ProductPriceAndSizeSection';
import ProductReviewsSection, { ProductReview } from '@/components/product/ProductReviewsSection';
import ProductRichContent from '@/components/product/ProductRichContent';
import ProductStatusBar from '@/components/product/ProductStatusBar';
import { ProductTabId } from '@/components/product/ProductTabs';
import ProductTags from '@/components/product/ProductTags';
import ProductThumbnailsStrip from '@/components/product/ProductThumbnailsStrip';
import ProductTitle from '@/components/product/ProductTitle';

export const ProductPage = () => {
  const tags = ['семейные', '4_шт.', '100%_хлопок'];
  const sizeOptions = [
    { id: 'brace1', label: 'Brace 1', subLabel: '44' },
    { id: 'brace2', label: 'Brace 2', subLabel: '46' },
    { id: 'brace3', label: 'Brace 3', subLabel: '48' },
    { id: 'brace4', label: 'Brace 4', subLabel: '50' },
    { id: 'brace5', label: 'Brace 5', subLabel: '52' },
    { id: 'brace6', label: 'Brace 6', subLabel: '54' },
    { id: 'brace7', label: 'Brace 7', subLabel: '56' },
    { id: 'brace8', label: 'Brace 8', subLabel: '58' },
    { id: 'brace9', label: 'Brace 9', subLabel: '60' },
  ];
  const [activeTab, setActiveTab] = useState<ProductTabId>('description');
  const reviews: ProductReview[] = [
    {
      id: 'rev1',
      name: 'Имя',
      status: 'статус',
      sizeLabel: 'Brace 2 (46)',
      purchaseDate: '12.10.2023',
      ratingValue: '5,0',
      text:
        'Отличное качество и посадка. Ткань приятная, швы аккуратные. Размер подошел идеально, буду заказывать еще.',
      helpfulCount: 3,
      notHelpfulCount: 0,
      utpLabel: 'УТП 1',
      utpSegments: 5,
      utpActiveIndex: 2,
      galleryCount: 5,
    },
  ];
  const complementProducts = [
    {
      id: 'comp-1',
      isNew: true,
      tags,
      price: '1 591 ₽',
      ratingCount: '11 794',
      ratingValue: '4,9',
    },
    {
      id: 'comp-2',
      isNew: true,
      tags,
      price: '1 591 ₽',
      ratingCount: '11 794',
      ratingValue: '4,9',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#29292B] font-montserrat pb-24">
      <ProductStatusBar />
      <ProductHeader />
      <ProductTitle title="Название" />
      <ProductMediaCarousel />
      <ProductThumbnailsStrip />
      <ProductTags tags={tags} />
      <ProductPriceAndSizeSection
        price="1 591 ₽"
        ratingCount="11 794"
        ratingValue="4,9"
        sizeOptions={sizeOptions}
        initialSizeId="brace2"
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
      <ProductReviewsSection reviews={reviews} />
      <ProductComplementSection products={complementProducts} />
      <ProductRichContent />
      <ProductBottomBar />
      {/* Остальные блоки будут добавлены по новому дизайну */}
    </div>
  );
};
