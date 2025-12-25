import { Suspense, useEffect, useRef } from 'react';
import { RouteObject, useLocation, useRoutes } from 'react-router-dom';

import { CartPage } from '@/pages/cart/CartPage';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { Homepage } from '@/pages/Homepage';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';
import { ProductDescriptionPage } from '@/pages/product/ProductDescriptionPage';
import { ProductPage } from '@/pages/product/ProductPage';
import { ProductSpecsPage } from '@/pages/product/ProductSpecsPage';
import { AccountPage } from '@/pages/profile/AccountPage';
import { OrderDetailsPage } from '@/pages/profile/OrderDetailsPage';
import { OrdersPage } from '@/pages/profile/OrdersPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SizeTablePage } from '@/pages/size-table/SizeTablePage';
import { TextPage } from '@/pages/text/TextPage';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { trackAppOpen, trackScreenView } from '@/shared/analytics/tracker';

const routes: RouteObject[] = [
  { path: '/', element: <Homepage /> },
  { path: '/catalog', element: <CatalogPage /> },
  { path: '/product/:productId', element: <ProductPage /> },
  { path: '/product/:productId/description', element: <ProductDescriptionPage /> },
  { path: '/product/:productId/specs', element: <ProductSpecsPage /> },
  { path: '/cart', element: <CartPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/profile/account', element: <AccountPage /> },
  { path: '/profile/orders', element: <OrdersPage /> },
  { path: '/profile/orders/:orderId', element: <OrderDetailsPage /> },
  { path: '/size-table/:type', element: <SizeTablePage /> },
  { path: '/legal/:slug', element: <TextPage /> },
  { path: '/coming-soon', element: <PlaceholderPage /> },
];

export const AppRoutes = () => {
  const location = useLocation();
  const element = useRoutes(routes, location);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (!hasOpened.current) {
      trackAppOpen(location.pathname);
      hasOpened.current = true;
    }
    trackScreenView(location.pathname);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="text-slate-300">Загрузка...</div>}>
        <div key={location.pathname} className="page-transition">
          {element}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};
