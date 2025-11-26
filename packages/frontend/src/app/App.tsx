import { AppRoutes } from '@/app/routes';
import { AppLayout, Header, WebAppHeader } from '@/components/brace';

export const App = () => (
  <AppLayout>
    <WebAppHeader />
    <Header />
    <div className="flex-1 py-8">
      <AppRoutes />
    </div>
  </AppLayout>
);
