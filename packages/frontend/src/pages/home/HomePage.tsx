import { CTASection, Carousel, ProductGrid, SizeCalculator } from '@/components/brace';
import { useProductsQuery } from '@/shared/api/queries';

export const HomePage = () => {
  const { data, isLoading, isError, refetch } = useProductsQuery();
  const products = data?.items ?? [];

  const slides = products.slice(0, 3).map((product) => ({
    id: product.id,
    title: product.name,
    description: product.description ?? 'Адаптивный силуэт и технологичные материалы BRACE.',
    image: product.hero_media_url,
    eyebrow: 'Коллекция',
  }));

  return (
    <div className="space-y-16">
      <Carousel slides={slides} />

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-brace-neutral">Заголовок 1.1</p>
          <h2 className="text-heading font-bold text-brace-zinc">Эталонный product grid BRACE</h2>
        </div>
        <ProductGrid products={products.slice(0, 6)} isLoading={isLoading} isError={isError} onRetry={refetch} />
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-brace-neutral">Заголовок 1.2</p>
          <h2 className="text-heading font-bold text-brace-zinc">Соберите look за несколько кликов</h2>
        </div>
        <ProductGrid products={products.slice(6, 12)} isLoading={isLoading} isError={isError} onRetry={refetch} />
      </section>

      <SizeCalculator />
      <CTASection />
    </div>
  );
};
