import clsx from 'clsx';

import arrowLeftIcon from '@/assets/images/icon-arrow-left.svg';
import bagIcon from '@/assets/images/icon-bag.svg';
import cartIcon from '@/assets/images/icon-cart.svg';
import boxIcon from '@/assets/images/icon-box.svg';
import docsIcon from '@/assets/images/icon-docs.svg';
import giftIcon from '@/assets/images/icon-gift.svg';
import handsIcon from '@/assets/images/icon-hands.svg';
import homeIcon from '@/assets/images/icon-home.svg';
import logoBrace from '@/assets/images/logo-brace.svg';
import profileAccountIcon from '@/assets/images/icon-profile_white.svg';
import profileNavIcon from '@/assets/images/icon-profile.svg';
import supportIcon from '@/assets/images/icon-support.svg';
import { useUserProfileQuery } from '@/shared/api/queries';

const ProfileStatusBar = () => <div className="h-14 w-full bg-[#D9D9D9]" aria-hidden />;

const ProfileBackButton = () => (
  <button
    type="button"
    aria-label="Назад"
  >
    <img src={arrowLeftIcon} alt="" className="h-12 w-12" />
  </button>
);

const ProfileLogo = () => <img src={logoBrace} alt="BRACE logo" className="h-11 w-auto" />;

const ProfileHeader = () => (
  <header className="flex items-center justify-between bg-white px-3 py-4">
    <ProfileBackButton />
    <ProfileLogo />
  </header>
);

const ProfileTitle = () => (
  <div className="px-4 pt-4 pb-4 py-5">
    <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Профиль</h1>
  </div>
);

const ProfileUserDataHeader = () => (
  <h2 className="text-[18px] font-bold leading-[1.2] text-[#29292B]">Мои данные</h2>
);

type ProfileUserDataRowProps = {
  label: string;
  value: string;
};

const ProfileUserDataRow = ({ label, value }: ProfileUserDataRowProps) => (
  <div className="flex h-6 items-center justify-between gap-2">
    <span className="text-[14px] font-medium text-[#29292B]">{label}</span>
    <span className="inline-flex h-[30px] w-[11px] shrink-0 items-center justify-center rounded-full bg-white px-4 py-1.5 text-[14px] font-bold text-[#29292B]">
      {value}
    </span>
  </div>
);

type ProfileUserDataSectionProps = {
  id: string;
  name: string;
  username: string;
};

const ProfileUserDataSection = ({ id, name, username }: ProfileUserDataSectionProps) => (
  <section className="mt-0 w-full bg-[#D9D9D9] px-4 py-3">
    <ProfileUserDataHeader />
    <div className="mt-3 flex flex-col gap-2">
      <ProfileUserDataRow label="ID" value={id} />
      <ProfileUserDataRow label="Имя" value={name} />
      <ProfileUserDataRow label="Username" value={username} />
    </div>
  </section>
);

const ProfileSectionsHeader = () => (
  <h2 className="text-[20px] font-bold leading-[1.2] text-[#29292B]">Разделы</h2>
);

type ProfileSectionItemProps = {
  label: string;
  icon: string;
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
    → {label}
  </span>
);
const ProfileSectionItem = ({ label, icon }: ProfileSectionItemProps) => (
  <button
    type="button"
    aria-label={`Перейти: ${label}`}
    className="group flex w-full items-center gap-3 bg-transparent px-0 py-0 transition duration-150 ease-out hover:brightness-105 active:scale-[0.97] cursor-pointer"
  >
    <ProfileSectionIcon icon={icon} />
    <ProfileSectionButton label={label} />
  </button>
);

const sectionsList: ProfileSectionItemProps[] = [
  { label: 'мои заказы', icon: boxIcon },
  { label: 'мой аккаунт', icon: profileAccountIcon },
  { label: 'бонусная система', icon: giftIcon },
  { label: 'реферальная система', icon: handsIcon },
  { label: 'поддержка', icon: supportIcon },
  { label: 'юридические документы', icon: docsIcon },
];

const ProfileSectionsSection = () => (
  <section className="mt-1 w-full bg-white px-4 pb-10 pt-6">
    <ProfileSectionsHeader />
    <div className="mt-4 flex flex-col gap-3">
      {sectionsList.map((item) => (
        <ProfileSectionItem key={item.label} label={item.label} icon={item.icon} />
      ))}
    </div>
  </section>
);

type BottomNavItemProps = {
  icon: string;
  label: string;
  isActive?: boolean;
};

const BottomNavItem = ({ icon, label, isActive }: BottomNavItemProps) => (
  <button
    type="button"
    aria-label={label}
    className={clsx(
      'flex h-16 w-16 items-center justify-center rounded-2xl bg-white transition duration-150 ease-out active:scale-[0.97] cursor-pointer',
      isActive ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.05)]' : '',
    )}
  >
    <img src={icon} alt="" className="h-9 w-9" />
  </button>
);

const BottomNavigation = () => (
  <nav className="mt-12 mx-auto flex h-[80px] w-[calc(100%-48px)] max-w-[420px] items-center justify-center gap-10 rounded-[10px] bg-[#D9D9D9] px-4 py-3">
    <BottomNavItem icon={homeIcon} label="Домой" />
    <BottomNavItem icon={bagIcon} label="Сумка" />
    <BottomNavItem icon={cartIcon} label="Корзина" />
    <BottomNavItem icon={profileNavIcon} label="Профиль" isActive />
  </nav>
);

export const ProfilePage = () => {
  const { data } = useUserProfileQuery();

  const profileId = data?.telegram_id?.toString() ?? data?.id ?? '1234567890';
  const profileName = [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim() || 'Имя';
  const profileUsername = data?.username ? `@${data.username}` : '@Name';

  return (
    <div className="min-h-screen bg-white font-montserrat text-[#29292B]">
      <ProfileStatusBar />
      <ProfileHeader />
      <ProfileTitle />
      <ProfileUserDataSection id={profileId} name={profileName} username={profileUsername} />
      <ProfileSectionsSection />
      <BottomNavigation />
    </div>
  );
};





