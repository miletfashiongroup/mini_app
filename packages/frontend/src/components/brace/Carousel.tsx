import { useMemo, useState } from 'react';

import { Badge } from './Badge';
import { NavigationArrows } from './NavigationArrows';

type Slide = {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  eyebrow?: string;
};

const defaultSlides: Slide[] = [
  {
    id: 'default-1',
    title: 'BRACE Essential',
    description: 'Новая коллекция с адаптивными тканями и акцентом на высокую посадку.',
    image: null,
    eyebrow: 'коллекция',
  },
  {
    id: 'default-2',
    title: 'Telegram Mini Store',
    description: 'Полностью адаптирован под мини приложения. 3 клика до покупки.',
    image: null,
    eyebrow: 'онлайн',
  },
];

interface Props {
  slides?: Slide[];
}

export const Carousel = ({ slides }: Props) => {
  const data = slides && slides.length ? slides : defaultSlides;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = useMemo(() => data[activeIndex], [activeIndex, data]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + data.length) % data.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % data.length);
  };

  return (
    <section className="space-y-5 rounded-3xl border border-brace-surface bg-white/60 p-8 shadow-lg shadow-black/5">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          {activeSlide.eyebrow && <Badge variant="light">{activeSlide.eyebrow}</Badge>}
          <h2 className="text-heading font-bold text-brace-zinc">{activeSlide.title}</h2>
          <p className="text-lg text-brace-neutral">{activeSlide.description}</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <NavigationArrows onPrev={handlePrev} onNext={handleNext} />
            <div className="flex gap-2">
              {data.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Переключиться на ${index + 1}-й слайд`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-3 w-3 rounded-full ${
                    index === activeIndex ? 'bg-brace-black' : 'bg-brace-surface'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          {activeSlide.image ? (
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="h-72 w-full rounded-3xl object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-72 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-brace-slate to-brace-black text-white">
              <span className="text-4xl font-bold tracking-[0.6em]">BRACE</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
