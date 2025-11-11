import { Link } from 'react-router-dom';
import type { Product } from '../types';

const ProductCard = ({ product }: { product: Product }) => (
  <Link
    to={`/product/${product.id}`}
    className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5 backdrop-blur"
  >
    <div
      className="h-36 rounded-xl bg-cover bg-center"
      style={{ backgroundImage: `url(${product.hero_media_url})` }}
    />
    <div>
      <p className="text-sm text-slate-300">Коллекция</p>
      <h3 className="text-lg font-semibold">{product.name}</h3>
    </div>
    <div className="flex items-center justify-between text-sm text-slate-300">
      <span>{product.variants[0]?.price ?? 0} ₽</span>
      <span>{product.variants.length} размеров</span>
    </div>
  </Link>
);

export default ProductCard;
