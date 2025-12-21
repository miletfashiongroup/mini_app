import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const contentMap: Record<string, { title: string; body: string }> = {
  privacy: {
    title: 'Политика конфиденциальности',
    body:
      '<p>Мы запрашиваем согласие на обработку персональных данных перед сбором информации.</p>' +
      '<p>Храним: Telegram ID, ФИО, телефон, email (если указан), дату рождения, пол и историю заказов.</p>' +
      '<p>Данные используются для выполнения сервиса и аналитики аудитории.</p>',
  },
  offer: {
    title: 'Публичная оферта',
    body: '<p>Заказывая продукцию BRACE, вы соглашаетесь с условиями продажи и доставки.</p>',
  },
};

export const TextPage = () => {
  const { slug = 'privacy' } = useParams();
  const navigate = useNavigate();

  const content = useMemo(() => contentMap[slug] ?? contentMap.privacy, [slug]);

  return (
    <section className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-slate-300 underline-offset-2" type="button">
        ← Назад
      </button>
      <h1 className="text-2xl font-semibold">{content.title}</h1>
      <article
        className="prose prose-invert"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
      />
    </section>
  );
};
