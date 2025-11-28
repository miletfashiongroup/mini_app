import { Suspense } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';

import { CartPage } from '@/pages/cart/CartPage';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { Homepage } from '@/pages/Homepage';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';
import { ProductDescriptionPage } from '@/pages/product/ProductDescriptionPage';
import { ProductPage } from '@/pages/product/ProductPage';
import { ProductSpecsPage } from '@/pages/product/ProductSpecsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SizeTablePage } from '@/pages/size-table/SizeTablePage';
import { TextPage } from '@/pages/text/TextPage';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

const routes: RouteObject[] = [
  { path: '/', element: <Homepage /> },
  { path: '/catalog', element: <CatalogPage /> },
  { path: '/product/:productId', element: <ProductPage /> },
  { path: '/product/:productId/description', element: <ProductDescriptionPage /> },
  { path: '/product/:productId/specs', element: <ProductSpecsPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/size-table/:type', element: <SizeTablePage /> },
  { path: '/legal/:slug', element: <TextPage /> },
  { path: '/coming-soon', element: <PlaceholderPage /> },
];

export const AppRoutes = () => {
  const element = useRoutes(routes);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="text-slate-300">Загрузка...</div>}>{element}</Suspense>
    </ErrorBoundary>
  );
};
