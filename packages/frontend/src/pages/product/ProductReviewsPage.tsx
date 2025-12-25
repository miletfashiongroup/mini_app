import { useNavigate, useParams } from 'react-router-dom';

import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import { mockProductReviews } from '@/pages/product/mockReviews';
import { useProductDetails } from '@/pages/product/useProductDetails';

export const ProductReviewsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProductDetails(productId);
  const reviews = mockProductReviews;

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
