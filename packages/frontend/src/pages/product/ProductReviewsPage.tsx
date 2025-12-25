import { useNavigate, useParams } from 'react-router-dom';

import ProductReviewsSection, { type ProductReview } from '@/components/product/ProductReviewsSection';
import { useProductDetails } from '@/pages/product/useProductDetails';
import { useProductReviewsQuery } from '@/shared/api/queries';

export const ProductReviewsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProductDetails(productId);
  const { data: productReviews = [] } = useProductReviewsQuery(productId ?? '');
  const reviews: ProductReview[] = productReviews.map((review) => ({
    id: review.id,
    name: review.is_anonymous ? 'Аноним' : review.author_name || 'Покупатель',
    status: review.purchase_date ? 'Проверенный покупатель' : 'Покупатель',
    ratingStarsCount: review.rating,
    sizeLabel: review.size_label || undefined,
    purchaseDate: review.purchase_date
      ? new Date(review.purchase_date).toLocaleDateString('ru-RU')
      : undefined,
    text: review.text,
    helpfulCount: review.helpful_count ?? 0,
    notHelpfulCount: review.not_helpful_count ?? 0,
    gallery: review.media?.map((media) => media.url) ?? [],
  }));

  if (isLoading) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-[#29292B]">
        Загружаем отзывы...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-[#29292B]">
        Не удалось загрузить отзывы.
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col overflow-x-hidden bg-white pb-24 font-montserrat text-[#29292B]">
      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={() => navigate(`/product/${product.id}`)}
          className="text-[13px] text-[#8E8E8E]"
        >
          ← Назад к товару
        </button>
        <h1 className="mt-3 text-[20px] font-semibold">Отзывы {product.name}</h1>
      </div>
      <ProductReviewsSection reviews={reviews} showCta={false} />
    </div>
  );
};
