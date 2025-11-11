import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import ProductCard from '../components/ProductCard';
import SizeCalculator from '../components/SizeCalculator';
import useProducts from '../hooks/useProducts';

const HomeScreen = () => {
  const { data: products = [] } = useProducts();

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-slate-300 tracking-[0.3em]">BRACE</p>
        <h1 className="text-3xl font-semibold leading-tight">
          Мужское белье<br />
          нового поколения
        </h1>
      </header>

      <Carousel />

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Популярные товары</h2>
          <Link to="/catalog" className="text-sm text-slate-300">
            Смотреть все →
          </Link>
        </div>
        <div className="grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-2">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <SizeCalculator />
    </section>
  );
};

export default HomeScreen;
