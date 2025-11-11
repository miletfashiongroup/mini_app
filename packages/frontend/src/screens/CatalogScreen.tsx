import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import useProducts from '../hooks/useProducts';

const sizes = ['S', 'M', 'L', 'XL'];

const CatalogScreen = () => {
  const { data: products = [] } = useProducts();
  const [query, setQuery] = useState('');
  const [size, setSize] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      const matchesSize = size ? product.variants.some((variant) => variant.size === size) : true;
      return matchesQuery && matchesSize;
    });
  }, [products, query, size]);

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Каталог</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
        />
        <div className="flex gap-2 overflow-x-auto">
          {sizes.map((option) => (
            <button
              key={option}
              onClick={() => setSize((prev) => (prev === option ? null : option))}
              className={`px-4 py-2 rounded-full border text-sm ${
                size === option ? 'bg-white text-black' : 'border-white/20 text-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {!filtered.length && <p className="text-slate-400 col-span-2">Ничего не найдено</p>}
      </div>
    </section>
  );
};

export default CatalogScreen;
