import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ProductBottomBar from '@/components/product/ProductBottomBar';
import ProductComplementSection from '@/components/product/ProductComplementSection';
import ProductHeader from '@/components/product/ProductHeader';
import { ProductCharacteristicsModal, ProductDescriptionModal } from '@/components/product/ProductInfoModal';
import ProductMediaCarousel from '@/components/product/ProductMediaCarousel';
import ProductPriceAndSizeSection from '@/components/product/ProductPriceAndSizeSection';
import ProductReviewsSection, { ProductReview } from '@/components/product/ProductReviewsSection';
import ProductRichContent from '@/components/product/ProductRichContent';
import ProductSizeTableModal from '@/components/product/ProductSizeTableModal';
import ProductStatusBar from '@/components/product/ProductStatusBar';
import { ProductTabId } from '@/components/product/ProductTabs';
import ProductTags from '@/components/product/ProductTags';
import ProductThumbnailsStrip from '@/components/product/ProductThumbnailsStrip';
import ProductTitle from '@/components/product/ProductTitle';
import { useProductDetails } from '@/pages/product/useProductDetails';
import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { useRelatedProductsQuery } from '@/shared/api/queries';
import { useToast } from '@/shared/hooks/useToast';

export const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProductDetails(productId);
  const { data: related } = useRelatedProductsQuery(productId ?? '', { enabled: Boolean(productId) });
  const addToCart = useAddToCartMutation();
  const toast = useToast();
  const tags: string[] = product?.tags?.length ? product.tags : ['семейные', '4_шт.', '100%_хлопок'];
  const [activeTab, setActiveTab] = useState<ProductTabId>('description');
  const [isSizeTableOpen, setIsSizeTableOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isCharacteristicsModalOpen, setIsCharacteristicsModalOpen] = useState(false);
  const rubleFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formatPrice = (minorUnits?: number) =>
    typeof minorUnits === 'number' ? rubleFormatter.format(minorUnits / 100) : '—';
  const reviews: ProductReview[] = [
    {
      id: 'rev1',
      name: 'Имя',
      status: 'статус',
      sizeLabel: 'Brace 2 (46)',
      purchaseDate: '12.10.2023',
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
    ...(related?.items ?? []).map((item) => {
      const variant = item.variants?.[0];
      return {
        id: item.id,
        isNew: Boolean(item.is_new),
        tags: (item.tags ?? []).map((tag: string) => `#${tag}`),
        price: formatPrice(variant?.price_minor_units),
        ratingCount: typeof item.rating_count === 'number' ? item.rating_count.toString() : '—',
        ratingValue: typeof item.rating_value === 'number' ? item.rating_value.toFixed(1) : '—',
      };
    }),
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-white pb-24 font-montserrat text-text-primary">Загружаем товар...</div>;
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-white pb-24 font-montserrat text-text-primary">
        Не удалось загрузить товар.
      </div>
    );
  }
  // Guard until data is present
  const safeProduct = product;

  const sizeOptions =
    product.variants?.map((variant): { id: string; label: string; subLabel: string } => ({
      id: variant.id,
      label: variant.size,
      subLabel: variant.size,
    })) ?? [];
  const primaryVariant = product.variants?.[0];
  const priceLabel = formatPrice(primaryVariant?.price_minor_units);
  const defaultSize = primaryVariant?.size;

  return (
    <div className="min-h-screen bg-white text-[#29292B] font-montserrat pb-24">
      <ProductStatusBar />
      <ProductHeader />
      <ProductTitle title={product.name} />
      <ProductMediaCarousel />
      <ProductThumbnailsStrip />
      <ProductTags tags={tags} />
      <ProductPriceAndSizeSection
        price={priceLabel}
        ratingCount="11 794"
        ratingValue="4,9"
        sizeOptions={sizeOptions}
        initialSizeId={sizeOptions[0]?.id ?? ''}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSizeTable={() => setIsSizeTableOpen(true)}
        onOpenDescription={() => setIsDescriptionModalOpen(true)}
        onOpenSpecs={() => setIsCharacteristicsModalOpen(true)}
      />
      <ProductReviewsSection reviews={reviews} />
      <ProductComplementSection products={complementProducts} />
      <ProductRichContent />
      <ProductBottomBar
        onAddToCart={() => {
          if (!defaultSize || !productId) {
            toast.error('Размер недоступен');
            return;
          }
          addToCart.mutate(
            { product_id: productId, size: defaultSize, quantity: 1 },
            {
              onError: (err: any) => toast.error(err?.message || 'Не удалось добавить в корзину.'),
              onSuccess: () => toast.success('Товар добавлен в корзину'),
            },
          );
        }}
        onBuyNow={() => navigate(`/cart`)}
      />
      {/* Остальные блоки будут добавлены по новому дизайну */}
      <ProductDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        content={
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#29292B]">О продукте</h3>
            <p className="text-[14px] leading-relaxed text-[#29292B]">
              {safeProduct.description ??
                'Описания для этого товара ещё нет. Мы обновим страницу, как только появится больше информации.'}
            </p>
          </div>
        }
      />
      <ProductCharacteristicsModal
        isOpen={isCharacteristicsModalOpen}
        onClose={() => setIsCharacteristicsModalOpen(false)}
        content={
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#29292B]">Характеристики</h3>
            <ul className="list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#29292B]">
              {(safeProduct.specs ?? ['Характеристики пока не заполнены.']).map(
                (spec: string, idx: number) => (
                  <li key={idx}>{spec}</li>
                ),
              )}
            </ul>
          </div>
        }
      />
      <ProductSizeTableModal isOpen={isSizeTableOpen} onClose={() => setIsSizeTableOpen(false)} />
    </div>
  );
};
