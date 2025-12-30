import { SignalIcon, WifiIcon } from '@heroicons/react/24/solid';

import { BackButton } from './BackButton';

export const WebAppHeader = () => (
  <div className="sticky top-0 z-30 mb-6 flex items-center justify-between rounded-b-3xl border border-brace-surface/70 bg-white/90 px-5 py-3 shadow-xl shadow-black/10 backdrop-blur">
    <div className="flex items-center gap-3">
      <BackButton label="Назад" />
      <div className="text-xs uppercase tracking-[0.3em] text-brace-neutral">Telegram Mini App</div>
    </div>
    <div className="flex items-center gap-2 text-brace-zinc">
      <SignalIcon className="h-4 w-4" aria-hidden />
      <WifiIcon className="h-4 w-4" aria-hidden />
      <div className="text-sm font-semibold">12:45</div>
    </div>
  </div>
);
