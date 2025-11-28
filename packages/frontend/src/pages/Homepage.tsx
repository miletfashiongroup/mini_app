import logoBrace from '@/assets/images/logo-brace.svg';
import arrowLeft from '@/assets/images/icon-arrow-left.svg';
import arrowRight from '@/assets/images/icon-arrow-right.svg';
import playIcon from '@/assets/images/icon-play.svg';
import cartIcon from '@/assets/images/icon-cart.svg';
import checkIcon from '@/assets/images/icon-check.svg';
import figureBody from '@/assets/images/figure-body.svg';
import homeIcon from '@/assets/images/icon-home.svg';
import bagIcon from '@/assets/images/icon-bag.svg';
import profileIcon from '@/assets/images/icon-profile.svg';

type ProductCardProps = {
  isNew?: boolean;
  title: string;
};

const SliderDots = () => (
  <div className="mt-4 flex items-center justify-center gap-3">
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
        aria-hidden
      />
    ))}
  </div>
);

const ProductCard = ({ isNew, title }: ProductCardProps) => (
  <div className="relative h-48 rounded-[25px] bg-gray-100 shadow-subtle">
    {isNew && (
      <span className="absolute left-3 top-3 rounded-[6.03px] bg-black px-2 py-0.5 text-xs font-medium text-white">
        new
      </span>
    )}
    <img
      src={cartIcon}
      alt="Добавить в корзину"
      className="absolute right-3 top-3 h-6 w-6"
    />
    <div className="flex h-full items-center justify-center text-text-secondary text-sm">{title}</div>
  </div>
);

const SizeInput = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4">
    <label className="text-base font-bold text-text-primary">{label}</label>
    <div className="relative inline-flex items-center">
      <input
        type="text"
        className="h-10 w-24 rounded-[25px] bg-white px-3 text-sm text-text-primary shadow-subtle"
        placeholder="см"
      />
      <img
        src={checkIcon}
        alt="Подтверждено"
        className="absolute right-[-33px] top-1/2 h-5 w-5 -translate-y-1/2"
      />
    </div>
  </div>
);

const BottomNav = () => {
  const items = [
    { icon: homeIcon, label: 'Домой' },
    { icon: bagIcon, label: 'Сумка' },
    { icon: cartIcon, label: 'Корзина' },
    { icon: profileIcon, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t-[115px] border-white px-4 py-2">
      <div className="flex justify-between">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 transition hover:shadow-subtle active:scale-[0.98]"
            aria-label={item.label}
          >
            <img src={item.icon} alt={item.label} className="h-6 w-6" />
          </button>
        ))}
      </div>
    </nav>
  );
};

export const Homepage = () => {
  const cards: ProductCardProps[] = [
    { title: 'Карточка 1', isNew: true },
    { title: 'Карточка 2', isNew: true },
    { title: 'Карточка 3' },
  ];

  return (
    <div className="min-h-screen bg-white text-text-primary font-montserrat">
      <div className="h-[143px] bg-gray-100" aria-hidden="true" />

      <div className="pl-[37px] pt-[51px] pb-4">
        <img src={logoBrace} alt="Логотип BRACE" className="h-9 w-auto" />
      </div>

      <main className="flex flex-col gap-section-y px-4 pb-[200px]">
        <section>
          <h2 className="mb-4 text-h2 font-bold text-text-primary">Заголовок 1.1</h2>
          <div className="flex h-52 items-center justify-center rounded-[25px] bg-gray-100">
            <span className="text-base font-semibold text-text-secondary">Баннер</span>
          </div>
          <SliderDots />
        </section>

        <section className="relative flex items-center justify-center">
          <button
            type="button"
            aria-label="Предыдущий"
            className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95"
          >
            <img src={arrowLeft} alt="" className="h-8 w-8" />
          </button>

          <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-[25px] bg-gray-100">
            <button
              type="button"
              aria-label="Воспроизвести видео"
              className="flex h-12 w-12 items-center justify-center"
            >
              <img src={playIcon} alt="" className="h-12 w-12" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Следующий"
            className="absolute -right-4 flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95"
          >
            <img src={arrowRight} alt="" className="h-8 w-8" />
          </button>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-h2 font-bold text-text-primary">Заголовок 1.2</h2>
          <div className="overflow-hidden">
            <div className="grid min-w-[120%] -translate-x-[10%] grid-cols-3 gap-[26px]">
              {cards.map((card) => (
                <ProductCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[25px] bg-gray-100 p-4">
          <p className="mb-4 text-sm text-text-primary">
            Введите ваши данные, а мы подберем размер.
          </p>

          <div className="flex flex-col">
            <SizeInput label="Обхват талии" />
            <div className="mt-[48px]">
              <SizeInput label="Обхват бедер" />
            </div>

            <button
              type="button"
              className="mt-4 inline-flex w-fit items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 active:opacity-80"
            >
              рассчитать
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <img src={figureBody} alt="Схема измерений" className="w-full max-w-[220px]" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="text-[45px] font-bold leading-[1.1]">
                <span className="block">Ваш размер</span>
                <span className="block">BRACE</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-24 items-center justify-center rounded-[25px] bg-white px-3 text-base text-text-secondary shadow-subtle">
                  M
                </div>
                <button
                  type="button"
                  className="rounded-[25px] bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 active:opacity-80"
                >
                  перейти в каталог
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Homepage;
