import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { BackButton } from '@/components/brace';

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

  const content = useMemo(() => contentMap[slug] ?? contentMap.privacy, [slug]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
      <div className="px-4 pt-6">
        <BackButton iconOnly fallbackTo="/profile" />
      </div>
      <section className="space-y-4 px-4 pt-4">
        <h1 className="text-2xl font-semibold">{content.title}</h1>
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      </section>
    </div>
  );
};
