import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface Props {
  onPrev: () => void;
  onNext: () => void;
}

export const NavigationArrows = ({ onPrev, onNext }: Props) => (
  <div className="flex gap-3">
    <button
      type="button"
      aria-label="Предыдущий слайд"
      onClick={onPrev}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-brace-black text-white shadow-lg"
    >
      <ArrowLeftIcon className="h-6 w-6" />
    </button>
    <button
      type="button"
      aria-label="Следующий слайд"
      onClick={onNext}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-brace-black text-white shadow-lg"
    >
      <ArrowRightIcon className="h-6 w-6" />
    </button>
  </div>
);
