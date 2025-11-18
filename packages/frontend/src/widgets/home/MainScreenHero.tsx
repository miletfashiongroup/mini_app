import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Product } from '@/entities/product/model/types';
import { calculateSize } from '@/features/size-calculator/api/sizeCalcApi';
import { useBannersQuery } from '@/shared/api/queries';
import { formatPrice } from '@/shared/lib/money';
import { Button, Input, Text } from '@/shared/ui';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Skeleton } from '@/shared/ui/Skeleton';

export type MainScreenHeroProps = {
  products: Product[];
};

export const MainScreenHero = ({ products }: MainScreenHeroProps) => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useBannersQuery();
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
      <div className="rounded-3xl bg-gradient-to-b from-sand to-sand-dark text-gray-dark p-6 md:p-10 flex flex-col gap-6 md:flex-row shadow-2xl shadow-blue-dark/10">
        <div className="flex-1 space-y-4">
          <Text variant="overline">BRACE</Text>
          <Text as="h1" variant="display">
            Мужское белье нового поколения
          </Text>
          <Text className="max-w-xl text-gray-dark/80">
            Технологичные ткани, адаптивная посадка и дизайн, созданный специально для Telegram Mini
            App.
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate('/catalog')}>
              Смотреть каталог
            </Button>
            <Button variant="secondary" onClick={() => navigate('/size-table/men')}>
              Таблица размеров
            </Button>
          </div>
        </div>
        <div className="flex-1">
          {isLoading && <Skeleton className="h-64 rounded-2xl" />}
          {isError && (
            <ErrorState message="Не удалось загрузить баннеры." onRetry={() => refetch()} />
          )}
          {!isLoading && !isError && currentBanner && (
            <div className="relative h-64 overflow-hidden rounded-2xl bg-gray-light text-gray-dark">
              <img
                src={currentBanner.image_url}
                alt="Акционный баннер"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 flex flex-col justify-between">
                <Button
                  variant="ghost"
                  className="self-start gap-2 bg-white/20 text-white hover:bg-white/30"
                  onClick={() => currentBanner.video_url && window.open(currentBanner.video_url, '_blank')}
                >
                  <PlayCircleIcon className="h-4 w-4" />
                  Смотреть видео
                </Button>
                <div className="flex justify-between items-center text-sm text-white">
                  <Button
                    variant="ghost"
                    aria-label="Предыдущий баннер"
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                    onClick={() => setActiveBannerIndex((prev) => prev - 1)}
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </Button>
                  <span className="text-xs uppercase tracking-[0.2em]">
                    {String(activeBannerIndex + 1).padStart(2, '0')}
                  </span>
                  <Button
                    variant="ghost"
                    aria-label="Следующий баннер"
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                    onClick={() => setActiveBannerIndex((prev) => prev + 1)}
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-blue-dark text-white border border-blue-dark/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="overline" className="text-gray-light/70">
              Подборка
            </Text>
            <Text as="h2" variant="title">
              Главные новинки недели
            </Text>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="rounded-full border border-white/20 p-2"
              onClick={() => rotateProducts(-1)}
              disabled={!products.length}
              aria-label="Предыдущий товар"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="rounded-full border border-white/20 p-2"
              onClick={() => rotateProducts(1)}
              disabled={!products.length}
              aria-label="Следующий товар"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {products.length === 0 ? (
          <Text className="text-gray-light/70">Нет товаров для отображения.</Text>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {visibleProducts.map((product) => (
              <button
                type="button"
                key={`${product.id}-${product.name}`}
                className="rounded-2xl bg-white/10 p-4 text-left hover:bg-white/20 transition"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <Text variant="body" className="text-gray-light/80">
                  {product.name}
                </Text>
                <Text as="p" variant="title">
                  {product.variants?.length
                    ? formatPrice(product.variants[0]?.price_minor_units ?? 0)
                    : 'Нет в наличии'}
                </Text>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-light/30 bg-white/80 p-6 space-y-4 text-gray-dark">
          <Text variant="body" className="text-gray-dark/80">
            Подбор размера
          </Text>
          <Text variant="title">Введите параметры, мы подберем размер</Text>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <Text variant="overline" className="text-gray-dark/70">
                Талия
              </Text>
              <Input
                type="number"
                value={waistValue}
                onChange={(event) => setWaistValue(event.target.value)}
                placeholder="Талия (см)"
              />
            </label>
            <label className="space-y-2">
              <Text variant="overline" className="text-gray-dark/70">
                Бедра
              </Text>
              <Input
                type="number"
                value={hipValue}
                onChange={(event) => setHipValue(event.target.value)}
                placeholder="Бедра (см)"
              />
            </label>
          </div>
          {calcError && <Text className="text-red-500 text-sm">{calcError}</Text>}
          <div className="flex items-center justify-between">
            <div>
              <Text variant="overline" className="text-gray-dark/70">
                Ваш размер
              </Text>
              <Text variant="display">{sizeResult}</Text>
            </div>
            <Button variant="primary" onClick={handleCalculate} disabled={isCalculating}>
              {isCalculating ? 'Расчет…' : 'Рассчитать'}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-blue-dark text-white p-6 space-y-4">
          <Text variant="body" className="text-gray-light/80">
            Почему BRACE
          </Text>
          <ul className="space-y-3 text-sm text-gray-light/90">
            <li>• Ткани премиум-класса с защитой от износа</li>
            <li>• Доставка из Telegram Mini App без лишних шагов</li>
            <li>• Возврат без печати чеков прямо в приложении</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

