import { RouteObject, useRoutes } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import CatalogScreen from './screens/CatalogScreen';
import ProductScreen from './screens/ProductScreen';
import SizeSelectorScreen from './screens/SizeSelectorScreen';
import SizeTableScreen from './screens/SizeTableScreen';
import DescriptionScreen from './screens/DescriptionScreen';
import SpecsScreen from './screens/SpecsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import TextScreen from './screens/TextScreen';
import CartScreen from './screens/CartScreen';

const routes: RouteObject[] = [
  { path: '/', element: <HomeScreen /> },
  { path: '/catalog', element: <CatalogScreen /> },
  { path: '/product/:id', element: <ProductScreen /> },
  { path: '/size-selector', element: <SizeSelectorScreen /> },
  { path: '/size-table/:type', element: <SizeTableScreen /> },
  { path: '/product/:id/description', element: <DescriptionScreen /> },
  { path: '/product/:id/specs', element: <SpecsScreen /> },
  { path: '/profile', element: <ProfileScreen /> },
  { path: '/coming-soon', element: <PlaceholderScreen /> },
  { path: '/legal/:slug', element: <TextScreen /> },
  { path: '/cart', element: <CartScreen /> }
];

const AppRoutes = () => useRoutes(routes);

export default AppRoutes;
