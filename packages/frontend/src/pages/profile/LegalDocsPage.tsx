import docsIcon from '@/assets/images/icon-docs.svg';
import { AppBottomNav, PageTopBar } from '@/components/brace';

const legalDocs = [
  {
    title: 'Согласие на обработку ПДн',
    subtitle: 'Подтверждение обработки персональных данных',
    url: 'https://telegra.ph/SOGLASIE-NA-OBRABOTKU-PERSONALNYH-DANNYH-02-03-5',
  },
  {
    title: 'Сведения об операторе ПДн',
    subtitle: 'Информация об операторе персональных данных',
    url: 'https://telegra.ph/SVEDENIYA-OB-OPERATORE-PERSONALNYH-DANNYH-02-03',
  },
  {
    title: 'Пользовательское соглашение',
    subtitle: 'Условия использования сервиса',
    url: 'https://telegra.ph/POLZOVATELSKOE-SOGLASHENIE-02-03-22',
  },
  {
    title: 'Политика конфиденциальности',
    subtitle: 'Как и зачем мы обрабатываем данные',
    url: 'https://telegra.ph/POLITIKA-KONFIDENCIALNOSTI-I-OBRABOTKI-PERSONALNYH-DANNYH-02-03',
  },
];

const LegalCard = ({ title, subtitle, url }: (typeof legalDocs)[number]) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-[1px]"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000043]">
      <img src={docsIcon} alt="" className="h-6 w-6 text-white" />
    </div>
    <div className="flex flex-1 flex-col">
      <span className="text-base font-semibold text-[#121212]">{title}</span>
      <span className="text-sm text-[#4B5563]">{subtitle}</span>
    </div>
    <span className="text-sm font-medium text-[#000043] underline decoration-[#000043]/40">Открыть</span>
  </a>
);

export const LegalDocsPage = () => (
  <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
    <PageTopBar />
    <section className="px-4 pt-6">
      <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Юридические документы</h1>
      <p className="mt-2 text-sm text-[#4B5563]">
        Ознакомьтесь с документами. Ссылки откроются в новом окне без выхода из мини‑аппа.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {legalDocs.map((doc) => (
          <LegalCard key={doc.url} {...doc} />
        ))}
      </div>
    </section>
    <AppBottomNav activeId="profile" />
  </div>
);
