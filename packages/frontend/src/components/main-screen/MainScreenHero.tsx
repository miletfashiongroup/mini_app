import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { bannerKeys, fetchBanners } from '@/entities/banner/api/bannerApi';
import type { Product } from '@/entities/product/model/types';
import { calculateSize } from '@/features/size-calculator/api/sizeCalcApi';
import { formatPrice } from '@/shared/lib/money';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Skeleton } from '@/shared/ui/Skeleton';

export type MainScreenHeroProps = {
  products: Product[];
};

export const MainScreenHero = ({ products }: MainScreenHeroProps) => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: bannerKeys.list(),
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
  });
  const banners = data?.banners ?? [];
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [productCarouselIndex, setProductCarouselIndex] = useState(0);
  const [waistValue, setWaistValue] = useState('');
  const [hipValue, setHipValue] = useState('');
  const [sizeResult, setSizeResult] = useState('—');
  const [calcError, setCalcError] = useState<string | null>(null);
  const { mutateAsync: requestSize, isPending: isCalculating } = useMutation({
    mutationFn: calculateSize,
  });

  const currentBanner = useMemo(() => {
    if (!banners.length) {
      return null;
    }
    const index = Math.abs(activeBannerIndex) % banners.length;
    return banners[index];
  }, [activeBannerIndex, banners]);

  const visibleProducts = useMemo(() => {
    if (!products.length) {
      return [];
    }
    const extended = [...products, ...products, ...products];
    return extended.slice(productCarouselIndex, productCarouselIndex + 3);
  }, [productCarouselIndex, products]);

  const rotateProducts = (direction: 1 | -1) => {
    setProductCarouselIndex((prev) => {
      if (!products.length) {
        return 0;
      }
      const next = prev + direction;
      if (next < 0) {
        return products.length - 1;
      }
      return next % products.length;
    });
  };

  const handleCalculate = useCallback(async () => {
    setCalcError(null);
    const waist = Number(waistValue);
    const hip = Number(hipValue);
    if (Number.isNaN(waist) || Number.isNaN(hip)) {
      setCalcError('Введите параметры в сантиметрах');
      return;
    }
    try {
      const result = await requestSize({ waist, hip });
      setSizeResult(result.size);
    } catch (error) {
      setCalcError(error instanceof Error ? error.message : 'Не удалось рассчитать');
    }
  }, [hipValue, requestSize, waistValue]);

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-b from-white via-white to-slate-100 text-slate-900 p-6 md:p-10 flex flex-col gap-6 md:flex-row">
        {/* PRINCIPAL-FIX: responsive rebuild */}
        <div className="flex-1 space-y-4">
          <p className="uppercase text-xs tracking-[0.3em] text-slate-500">BRACE</p>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">Мужское белье нового поколения</h1>
          <p className="text-slate-600 max-w-xl">
            Технологичные ткани, адаптивная посадка и дизайн, созданный специально для Telegram Mini App.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl bg-slate-900 text-white px-6 py-3 text-sm font-semibold"
              onClick={() => navigate('/catalog')}
            >
              Смотреть каталог
            </button>
            <button
              type="button"
              className="rounded-2xl border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900"
              onClick={() => navigate('/size-table/men')}
            >
              Таблица размеров
            </button>
          </div>
        </div>
        <div className="flex-1">
          {isLoading && <Skeleton className="h-64 rounded-2xl" />}
          {isError && (
            <ErrorState
              message="Не удалось загрузить баннеры."
              onRetry={() => refetch()}
            />
          )}
          {!isLoading && !isError && currentBanner && (
            <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-200 text-slate-50">
              <img
                src={currentBanner.image_url}
                alt="Акционный баннер"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 flex flex-col justify-between">
                <button
                  type="button"
                  className="self-start inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold"
                  onClick={() => currentBanner.video_url && window.open(currentBanner.video_url, '_blank')}
                >
                  <PlayCircleIcon className="h-4 w-4" /> Смотреть видео
                </button>
                <div className="flex justify-between items-center text-sm">
                  <button
                    type="button"
                    aria-label="Предыдущий баннер"
                    className="rounded-full bg-white/20 p-2"
                    onClick={() => setActiveBannerIndex((prev) => prev - 1)}
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-xs uppercase tracking-[0.2em]">{String(activeBannerIndex + 1).padStart(2, '0')}</span>
                  <button
                    type="button"
                    aria-label="Следующий баннер"
                    className="rounded-full bg-white/20 p-2"
                    onClick={() => setActiveBannerIndex((prev) => prev + 1)}
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Подборка</p>
            <h2 className="text-xl font-semibold">Главные новинки недели</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-white/20 p-2"
              onClick={() => rotateProducts(-1)}
              disabled={!products.length}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full border border-white/20 p-2"
              onClick={() => rotateProducts(1)}
              disabled={!products.length}
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {products.length === 0 ? (
          <p className="text-slate-400">Нет товаров для отображения.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {visibleProducts.map((product) => (
              <button
                type="button"
                key={`${product.id}-${product.name}`}
                className="rounded-2xl bg-white/10 p-4 text-left hover:bg-white/20 transition"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <p className="text-sm text-slate-300">{product.name}</p>
                <p className="text-xl font-semibold">
                  {product.variants?.length
                    ? formatPrice(product.variants[0]?.price_minor_units ?? 0)
                    : 'Нет в наличии'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm text-slate-300">Подбор размера</p>
          <h3 className="text-2xl font-semibold">Введите параметры, мы подберем размер</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-slate-400">Талия</span>
              <input
                type="number"
                value={waistValue}
                onChange={(event) => setWaistValue(event.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-transparent px-4 py-3 focus:border-white/60 focus:outline-none"
                placeholder="Талия (см)"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-slate-400">Бедра</span>
              <input
                type="number"
                value={hipValue}
                onChange={(event) => setHipValue(event.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-transparent px-4 py-3 focus:border-white/60 focus:outline-none"
                placeholder="Бедра (см)"
              />
            </label>
          </div>
          {calcError && <p className="text-sm text-red-300">{calcError}</p>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Ваш размер</p>
              <p className="text-3xl font-semibold">{sizeResult}</p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white text-slate-900 px-6 py-3 text-sm font-semibold disabled:opacity-50"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Расчет…' : 'Рассчитать'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm text-slate-300">Почему BRACE</p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>• Ткани премиум-класса с защитой от износа</li>
            <li>• Доставка из Telegram Mini App без лишних шагов</li>
            <li>• Возврат без печати чеков прямо в приложении</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
