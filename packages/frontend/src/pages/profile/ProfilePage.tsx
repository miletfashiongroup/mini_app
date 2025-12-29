import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import boxIcon from '@/assets/images/icon-box.svg';
import docsIcon from '@/assets/images/icon-docs.svg';
import giftIcon from '@/assets/images/icon-gift.svg';
import handsIcon from '@/assets/images/icon-hands.svg';
import heartIcon from '@/assets/images/icon-heart.svg';
import profileAccountIcon from '@/assets/images/icon-profile_white.svg';
import supportIcon from '@/assets/images/icon-support.svg';
import { AppBottomNav, PageTopBar } from '@/components/brace';
const ProfileTitle = () => (
  <div className="px-4 pb-4 pt-4">
    <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Профиль</h1>
  </div>
);

const ProfileSectionsHeader = () => (
  <h2 className="text-[20px] font-bold leading-[1.2] text-[#29292B]">Разделы</h2>
);

type ProfileSectionItemProps = {
  label: string;
  icon: string;
  onClick?: () => void;
};

const ProfileSectionIcon = ({ icon }: { icon: string }) => (
  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000043] text-white transition duration-150 ease-out group-hover:brightness-110 group-active:brightness-95">
    <img src={icon} alt="" className="h-6 w-7" />
  </div>
);

const ProfileSectionButton = ({ label }: { label: string }) => (
  <span
    className="flex h-12 flex-1 items-center justify-start rounded-2xl bg-[#000043] text-[16px] font-medium text-white transition duration-150 ease-out group-hover:bg-[#00005A] group-active:brightness-95"
    style={{ paddingLeft: '40px', paddingRight: '12px', textAlign: 'left' }}
  >
    {label}
  </span>
);

const ProfileSectionItem = ({ label, icon, onClick }: ProfileSectionItemProps) => {
  return (
    <button
      type="button"
      aria-label={`Перейти: ${label}`}
      className="group flex w-full items-center gap-3 bg-transparent px-0 py-0 transition duration-150 ease-out hover:brightness-105 active:scale-[0.97] cursor-pointer"
      onClick={onClick}
    >
      <ProfileSectionIcon icon={icon} />
      <ProfileSectionButton label={label} />
    </button>
  );
};

const ProfileSectionsSection = ({ items }: { items: ProfileSectionItemProps[] }) => (
  <section className="mt-1 w-full bg-white px-4 pb-10 pt-6">
    <ProfileSectionsHeader />
    <div className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <ProfileSectionItem key={item.label} label={item.label} icon={item.icon} onClick={item.onClick} />
      ))}
    </div>
  </section>
);

export const ProfilePage = () => {
  const navigate = useNavigate();

  const sections = useMemo<ProfileSectionItemProps[]>(
    () => [
      {
        label: 'мои заказы',
        icon: boxIcon,
        onClick: () => navigate('/profile/orders'),
      },
      {
        label: 'любимые товары',
        icon: heartIcon,
        onClick: () => navigate('/profile/favorites'),
      },
      {
        label: 'мой аккаунт',
        icon: profileAccountIcon,
        onClick: () => navigate('/profile/account'),
      },
      { label: 'бонусная система', icon: giftIcon, onClick: () => navigate('/coming-soon') },
      { label: 'реферальная система', icon: handsIcon, onClick: () => navigate('/coming-soon') },
      { label: 'поддержка', icon: supportIcon, onClick: () => navigate('/coming-soon') },
      { label: 'юридические документы', icon: docsIcon, onClick: () => navigate('/coming-soon') },
    ],
    [navigate],
  );

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <ProfileTitle />
      <ProfileSectionsSection items={sections} />
      <AppBottomNav activeId="profile" />
    </div>
  );
};
