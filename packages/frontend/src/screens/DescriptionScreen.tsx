import { useNavigate } from 'react-router-dom';
import useProduct from '../hooks/useProduct';

const DescriptionScreen = () => {
  const navigate = useNavigate();
  const { data } = useProduct();

  return (
    <section className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-slate-300">
        ← Назад
      </button>
      <h1 className="text-2xl font-semibold">Описание</h1>
      <p className="text-slate-200 leading-relaxed">
        {data?.description ||
          'BRACE — это минималистичное белье, созданное для движения. Мы используем трехмерный крой, адаптивные вставки и ткани премиального класса, чтобы завершить гардероб каждого дня.'}
      </p>
    </section>
  );
};

export default DescriptionScreen;
