import { useNavigate } from 'react-router-dom';

import shutterstock from '@/assets/images/shutterstock.svg';
import { PageTopBar } from '@/components/brace';
import CatalogBottomNavigation from '@/components/catalog/CatalogBottomNavigation';

const PlaceholderTitle = () => (
  <div className="bg-white px-4 pt-3 pb-4">
    <h1 className="text-[20px] font-bold leading-[29px] text-[#29292B]">Заголовок</h1>
  </div>
);

const PlaceholderCard = () => (
  <div className="px-4">
    <div className="mt-4 rounded-[16px] bg-white px-6 pb-8 pt-4">
      <div className="flex flex-col items-center text-center">
        <img src={shutterstock} alt="Шестерёнки" className="mx-auto w-[330px] max-w-full h-auto" />
        <h2 className="mt-0 text-[16px] font-bold leading-[22px] text-[#29292B]">Страница находится в разработке.</h2>
        <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#29292B]">Совсем скоро она заработает.</p>
        <PlaceholderPrimaryButton />
      </div>
    </div>
  </div>
);

const PlaceholderPrimaryButton = () => {
  const navigate = useNavigate();
  return (
    <div className="mt-7 flex w-full items-center justify-center">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex h-10 w-full max-w-[220px] items-center justify-center rounded-[13px] bg-[#000043] text-[16px] font-semibold text-white transition duration-150 ease-out hover:bg-[#00005A] active:scale-[0.97]"
      >
        В главное меню
      </button>
    </div>
  );
};

export const PlaceholderPage = () => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-[#29292B]">
      <PageTopBar />
      <PlaceholderTitle />
      <section className="bg-[#D9D9D9] border-t border-[#D9D9D9] pb-[15px]">
        <PlaceholderCard />
      </section>
      <div className="mt-auto" />
      <CatalogBottomNavigation activeId="home" />
    </div>
  );
};
