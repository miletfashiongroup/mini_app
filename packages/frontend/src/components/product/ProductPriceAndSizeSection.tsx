import { useState } from 'react';

import ProductPriceAndRating from './ProductPriceAndRating';
import ProductSizeSelector, { ProductSizeOption } from './ProductSizeSelector';
import ProductSizeTableBlock from './ProductSizeTableBlock';
import ProductTabs, { ProductTabId } from './ProductTabs';

type ProductPriceAndSizeSectionProps = {
  price: string;
  ratingCount: string;
  ratingValue: string;
  sizeOptions: ProductSizeOption[];
  initialSizeId?: string;
  onSelectSize?: (id: string) => void;
  activeTab: ProductTabId;
  onChangeTab: (tab: ProductTabId) => void;
  onOpenSizeTable?: () => void;
  onAddToCart?: () => void;
};

const ProductPriceAndSizeSection = ({
  price,
  ratingCount,
  ratingValue,
  sizeOptions,
  initialSizeId,
  onSelectSize,
  activeTab,
  onChangeTab,
  onOpenSizeTable,
  onAddToCart,
}: ProductPriceAndSizeSectionProps) => {
  const [selectedSize, setSelectedSize] = useState<string>(initialSizeId ?? sizeOptions[0]?.id ?? '');

  const handleSelectSize = (id: string) => {
    setSelectedSize(id);
    onSelectSize?.(id);
  };

  return (
    <section className="mt-0">
      <ProductPriceAndRating price={price} ratingCount={ratingCount} ratingValue={ratingValue} />
      <ProductSizeTableBlock onOpenSizeTable={onOpenSizeTable} onAddToCart={onAddToCart} />
      <ProductSizeSelector options={sizeOptions} activeId={selectedSize} onSelect={handleSelectSize} />
      <ProductTabs activeTab={activeTab} onChange={onChangeTab} />
    </section>
  );
};

export default ProductPriceAndSizeSection;
