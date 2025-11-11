import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useProduct from '../hooks/useProduct';
import { useCart } from '../hooks/useCart';

const ProductScreen = () => {
  const { id } = useParams();
  const { data: product } = useProduct();
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const price = useMemo(() => {
    if (!product || !size) return product?.variants[0]?.price ?? 0;
    return product.variants.find((variant) => variant.size === size)?.price ?? 0;
  }, [product, size]);

  if (!product) return <p className="text-slate-400">Загрузка...</p>;

  const handleAdd = () => {
    if (!size || !id) return;
    add.mutate({ product_id: id, size, quantity });
  };

  return (
    <section className="space-y-5">
      <div
        className="h-64 rounded-3xl bg-cover bg-center border border-white/10"
        style={{ backgroundImage: `url(${product.hero_media_url})` }}
      />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        <p className="text-slate-300">{product.description}</p>
      </div>

      <div className="flex gap-2">
        {product.variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => setSize(variant.size)}
            className={`px-4 py-2 rounded-full border ${
              size === variant.size ? 'bg-white text-black' : 'border-white/20 text-white'
            }`}
          >
            {variant.size}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-white/5 rounded-full flex items-center">
          <button className="px-4" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            –
          </button>
          <span className="px-4">{quantity}</span>
          <button className="px-4" onClick={() => setQuantity((q) => q + 1)}>+
          </button>
        </div>
        <div className="text-3xl font-semibold">{price * quantity} ₽</div>
      </div>

      <button
        className="w-full bg-white text-black rounded-2xl py-4 text-lg font-semibold disabled:opacity-40"
        disabled={!size}
        onClick={handleAdd}
      >
        Добавить в корзину
      </button>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Link to={`/product/${id}/description`} className="bg-white/5 rounded-2xl p-4">
          Описание →
        </Link>
        <Link to={`/product/${id}/specs`} className="bg-white/5 rounded-2xl p-4">
          Характеристики →
        </Link>
        <Link to="/size-selector" className="bg-white/5 rounded-2xl p-4">
          Таблица размеров →
        </Link>
        <Link to="/coming-soon" className="bg-white/5 rounded-2xl p-4">
          Отзывы →
        </Link>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Дополни образ</h3>
        <div className="text-sm text-slate-400">Скоро появятся персональные рекомендации.</div>
      </div>
    </section>
  );
};

export default ProductScreen;
