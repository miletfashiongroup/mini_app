import { AppRoutes } from '@/app/routes';
import { ProfileOnboardingGate } from '@/components/user/ProfileOnboardingGate';

export const App = () => (
  <div className="min-h-screen bg-white text-text-primary font-montserrat">
    <ProfileOnboardingGate>
      <AppRoutes />
    </ProfileOnboardingGate>
  </div>
);
