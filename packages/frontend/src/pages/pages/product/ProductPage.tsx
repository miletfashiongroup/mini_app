import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ProductBottomBar from '@/components/product/ProductBottomBar';
import ProductComplementSection from '@/components/product/ProductComplementSection';
import ProductHeader from '@/components/product/ProductHeader';
import { ProductCharacteristicsModal, ProductDescriptionModal } from '@/components/product/ProductInfoModal';
import ProductMediaCarousel, { type ProductMediaCarouselHandle } from '@/components/product/ProductMediaCarousel';
import { ProductImageLightbox } from '@/components/product/ProductImageLightbox';
import ProductPriceAndSizeSection from '@/components/product/ProductPriceAndSizeSection';
import ProductReviewsSection, { ProductReview } from '@/components/product/ProductReviewsSection';
import ProductRichContent from '@/components/product/ProductRichContent';
import ProductSizeTableModal from '@/components/product/ProductSizeTableModal';
import { ProductTabId } from '@/components/product/ProductTabs';
import ProductTags from '@/components/product/ProductTags';
import ProductThumbnailsStrip from '@/components/product/ProductThumbnailsStrip';
import ProductTitle from '@/components/product/ProductTitle';
import { useProductDetails } from '@/pages/product/useProductDetails';
import { useProductReviewsQuery } from '@/shared/api/queries';
import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { useRelatedProductsQuery } from '@/shared/api/queries';
import { useToast } from '@/shared/hooks/useToast';
import { trackEvent } from '@/shared/analytics/tracker';
import { formatTag } from '@/shared/lib/tags';

export const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProductDetails(productId);
  const { data: related } = useRelatedProductsQuery(productId ?? '', { enabled: Boolean(productId) });
  const addToCart = useAddToCartMutation();
  const toast = useToast();
  const tags: string[] = (product?.tags?.length ? product.tags : ['семейные', '4_шт.', '100%_хлопок'])
    .map(formatTag)
    .filter(Boolean);
  const [activeTab, setActiveTab] = useState<ProductTabId>('description');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const mediaCarouselRef = useRef<ProductMediaCarouselHandle | null>(null);
  const [isSizeTableOpen, setIsSizeTableOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isCharacteristicsModalOpen, setIsCharacteristicsModalOpen] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const productTracked = useRef(false);
  const rubleFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const countFormatter = new Intl.NumberFormat('ru-RU');
  const formatPrice = (minorUnits?: number) =>
    typeof minorUnits === 'number' ? rubleFormatter.format(minorUnits / 100) : '—';
  const variants = product?.variants ?? [];
  const sizeOptions = useMemo(() => {
    const sortedVariants = [...variants].sort((a, b) => {
      const aNum = Number(a.size);
      const bNum = Number(b.size);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
        return aNum - bNum;
      }
      if (Number.isFinite(aNum)) return -1;
      if (Number.isFinite(bNum)) return 1;
      return String(a.size).localeCompare(String(b.size), 'ru');
    });

    return sortedVariants.map((variant) => {
      const numericSize = Number(variant.size);
      const subLabel =
        Number.isFinite(numericSize) && numericSize >= 1
          ? String(44 + (numericSize - 1) * 2)
          : variant.size;
      return {
        id: variant.id,
        label: variant.size,
        subLabel,
      };
    });
  }, [variants]);
  const variantById = useMemo(() => new Map(variants.map((variant) => [variant.id, variant])), [variants]);
  const primaryVariant = variants[0];
  const priceLabel = formatPrice(primaryVariant?.price_minor_units);
  const selectedVariant = selectedSizeId ? variantById.get(selectedSizeId) : primaryVariant;
  const selectedSize = selectedVariant?.size ?? primaryVariant?.size;
  const currency = 'RUB';
  const ratingCountLabel =
    typeof product?.rating_count === 'number' ? countFormatter.format(product.rating_count) : '—';
  const ratingValueLabel =
    typeof product?.rating_value === 'number'
      ? product.rating_value.toFixed(1).replace('.', ',')
      : '—';
  const { data: productReviews = [] } = useProductReviewsQuery(productId ?? '');
  const reviews: ProductReview[] = useMemo(
    () =>
      productReviews.map((review) => ({
        id: review.id,
        name: review.author_name || 'Покупатель',
        status: review.purchase_date ? 'Проверенный покупатель' : 'Покупатель',
        ratingStarsCount: review.rating,
        sizeLabel: review.size_label || undefined,
        purchaseDate: review.purchase_date
          ? new Date(review.purchase_date).toLocaleDateString('ru-RU')
          : undefined,
        text: review.text,
        helpfulCount: review.helpful_count ?? 0,
        notHelpfulCount: review.not_helpful_count ?? 0,
        userVote: (review.user_vote as -1 | 0 | 1 | undefined) ?? 0,
        gallery: review.media?.map((media) => media.url) ?? [],
      })),
    [productReviews],
  );
  const previewReviews = useMemo(() => reviews.slice(0, 1), [reviews]);
  const complementProducts = [
    ...(related?.items ?? []).map((item) => {
      const variant = item.variants?.[0];
      return {
        id: item.id,
        isNew: Boolean(item.is_new),
        tags: (item.tags ?? []).map(formatTag).filter(Boolean),
        price: formatPrice(variant?.price_minor_units),
        ratingCount: typeof item.rating_count === 'number' ? item.rating_count.toString() : '—',
        ratingValue: typeof item.rating_value === 'number' ? item.rating_value.toFixed(1) : '—',
        defaultSize: variant?.size,
        imageUrl: item.hero_media_url || item.gallery?.[0] || null,
        sizes: Array.from(new Set((item.variants ?? []).map((entry) => entry.size).filter(Boolean))),
      };
    }),
  ];

  const galleryItems = useMemo(() => {
    const urls = [product?.hero_media_url, ...(product?.gallery ?? [])].filter(Boolean) as string[];
    return Array.from(new Set(urls));
  }, [product?.gallery, product?.hero_media_url]);

  useEffect(() => {
    if (!sizeOptions.length) {
      return;
    }
    const hasSelected = sizeOptions.some((option) => option.id === selectedSizeId);
    if (!selectedSizeId || !hasSelected) {
      setSelectedSizeId(sizeOptions[0].id);
    }
  }, [selectedSizeId, sizeOptions]);

  useEffect(() => {
    if (activeMediaIndex >= galleryItems.length) {
      setActiveMediaIndex(0);
    }
  }, [activeMediaIndex, galleryItems.length]);

  useEffect(() => {
    if (!productTracked.current && productId && product) {
      trackEvent(
        'product_view',
        {
          product_id: productId,
          category: product.category ?? null,
          price_minor_units: primaryVariant?.price_minor_units ?? null,
          currency,
        },
        `/product/${productId}`,
      );
      productTracked.current = true;
    }
  }, [currency, primaryVariant?.price_minor_units, product, productId]);

  const handleAddToCart = (shouldNavigate: boolean) => {
    if (!productId || !selectedSize) {
      toast.error('Выберите размер.');
      return;
    }
    addToCart.mutate(
      { product_id: productId, size: selectedSize, quantity: 1 },
      {
        onError: (err: any) => toast.error(err?.message || 'Не удалось добавить в корзину.'),
        onSuccess: () => {
          toast.success('Товар добавлен в корзину');
          if (shouldNavigate) {
            navigate('/cart');
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-text-primary">
        Загружаем товар...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-text-primary">
        Не удалось загрузить товар.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-text-primary">
        Загружаем товар...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-text-primary">
        Не удалось загрузить товар.
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white text-[#29292B] font-montserrat pb-24">
      <ProductHeader showBack backTo="/catalog" backFallback="/catalog" />
      <ProductTitle title={product.name} />
      <ProductMediaCarousel
        ref={mediaCarouselRef}
        items={galleryItems}
        activeIndex={activeMediaIndex}
        onChangeIndex={setActiveMediaIndex}
        onImageClick={() => setIsViewerOpen(true)}
      />
      <ProductThumbnailsStrip
        items={galleryItems}
        activeIndex={activeMediaIndex}
        onSelect={(index) => {
          setActiveMediaIndex(index);
          mediaCarouselRef.current?.scrollTo(index);
        }}
      />
      <ProductTags tags={tags} />
      <ProductPriceAndSizeSection
        price={priceLabel}
        ratingCount={ratingCountLabel}
        ratingValue={ratingValueLabel}
        sizeOptions={sizeOptions}
        initialSizeId={selectedSizeId || sizeOptions[0]?.id || ''}
        onSelectSize={(id) => {
          setSelectedSizeId(id);
          const variant = variantById.get(id);
          trackEvent(
            'size_selected',
            { product_id: productId, size: variant?.size ?? id },
            `/product/${productId}`,
          );
        }}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSizeTable={() => setIsSizeTableOpen(true)}
        onOpenDescription={() => setIsDescriptionModalOpen(true)}
        onOpenSpecs={() => setIsCharacteristicsModalOpen(true)}
      />
      <ProductReviewsSection
        reviews={previewReviews}
        moreLinkTo={productId ? `/product/${productId}/reviews` : undefined}
        showCta={false}
      />
      <ProductComplementSection products={complementProducts} />
      {/* ProductRichContent hidden until media data is ready */}
      <ProductBottomBar
        onAddToCart={() => handleAddToCart(false)}
        onBuyNow={() => handleAddToCart(true)}
      />
      {/* Остальные блоки будут добавлены по новому дизайну */}
      <ProductDescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        content={
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed text-[#29292B]">
              {product.description ??
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
            <ul className="list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#29292B]">
              {(product.specs ?? ['Характеристики пока не заполнены.']).map(
                (spec: string, idx: number) => (
                  <li key={idx}>{spec}</li>
                ),
              )}
            </ul>
          </div>
        }
      />
      <ProductSizeTableModal isOpen={isSizeTableOpen} onClose={() => setIsSizeTableOpen(false)} />
      <ProductImageLightbox
        isOpen={isViewerOpen}
        images={galleryItems}
        activeIndex={activeMediaIndex}
        onChangeIndex={setActiveMediaIndex}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
};
