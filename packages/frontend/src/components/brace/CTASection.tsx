export const CTASection = () => (
  <section className="rounded-3xl border border-brace-black bg-brace-black px-8 py-10 text-white">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-white/70">Коллекция 2024</p>
        <h3 className="text-heading font-bold">Готовы к заказу в Telegram</h3>
        <p className="text-lg text-white/80">Быстрая оплата, моментальная доставка статуса и безупречный UI.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-lg font-semibold"
        >
          Купить сейчас <span className="text-3xl">→</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-white/40 bg-transparent px-6 py-3 text-lg font-semibold"
        >
          Смотреть коллекцию
        </button>
      </div>
    </div>
  </section>
);
