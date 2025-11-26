import { ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';

export const Carousel = () => {
  const slides = useMemo(
    () => [
      {
        title: 'Бесшовный комфорт',
        video: 'https://cdn.coverr.co/videos/coverr-mens-fashion-runway-9469/1080p.mp4',
      },
      {
        title: 'Премиальные материалы',
        video: 'https://cdn.coverr.co/videos/coverr-tailor-cutting-fabric-8568/1080p.mp4',
      },
      {
        title: 'Создано для движения',
        video: 'https://cdn.coverr.co/videos/coverr-fabric-tilt-2805/1080p.mp4',
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const next = () => setIndex((prev) => (prev + 1) % slides.length);
  const prev = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10">
      <video
        key={slides[index].video}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-60 object-cover"
        src={slides[index].video}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex justify-between">
          <button onClick={prev} className="p-2 bg-black/40 rounded-full" type="button">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button onClick={next} className="p-2 bg-black/40 rounded-full" type="button">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div>
          <p className="text-sm text-slate-200">Видео-гайд</p>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <PlayCircleIcon className="h-6 w-6" />
            {slides[index].title}
          </h3>
        </div>
      </div>
    </div>
  );
};
