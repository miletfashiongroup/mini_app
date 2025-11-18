import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export const ErrorState = ({
  title = 'Что-то пошло не так',
  message = 'Попробуйте обновить данные или повторить попытку позже.',
  onRetry,
  retryLabel = 'Повторить',
}: Props) => (
  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 flex flex-col gap-3">
    <div className="flex items-center gap-2 font-semibold">
      <ExclamationTriangleIcon className="h-5 w-5" />
      {title}
    </div>
    <p>{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-xl bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/30"
      >
        {retryLabel}
      </button>
    )}
  </div>
);
