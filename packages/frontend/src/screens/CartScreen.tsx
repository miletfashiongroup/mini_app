import { useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import useOrder from '../hooks/useOrder';

const CartScreen = () => {
  const { data: items = [], remove } = useCart();
  const order = useOrder();

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  useEffect(() => {
    if (order.isSuccess) alert('Заказ создан, менеджер свяжется с вами');
  }, [order.isSuccess]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Корзина</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white/5 rounded-2xl p-4 flex gap-4">
            <div
              className="w-20 h-20 rounded-xl bg-cover"
              style={{ backgroundImage: `url(${item.hero_media_url})` }}
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.product_name}</h3>
              <p className="text-sm text-slate-400">Размер {item.size} · {item.quantity} шт.</p>
              <p className="text-lg font-semibold">{item.unit_price * item.quantity} ₽</p>
            </div>
            <button onClick={() => remove.mutate(item.id)} className="text-slate-400 text-sm">
              Удалить
            </button>
          </div>
        ))}
        {!items.length && <p className="text-slate-400">Корзина пуста</p>}
      </div>
      <div className="bg-white/5 rounded-2xl p-4 flex justify-between text-lg font-semibold">
        <span>Итого</span>
        <span>{total} ₽</span>
      </div>
      <button
        className="w-full bg-white text-black rounded-2xl py-4 text-lg font-semibold disabled:opacity-40"
        disabled={!items.length || order.isPending}
        onClick={() => order.mutate()}
      >
        Оформить заказ
      </button>
    </section>
  );
};

export default CartScreen;
