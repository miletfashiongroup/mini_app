import { useState } from 'react';

import boxersClassic from '@/assets/images/боксеры.svg';
import boxersExtended from '@/assets/images/боксеры_расшир.svg';
import classicSizeChartSvg from '@/assets/images/классич_табл.svg';
import extendedSizeChartSvg from '@/assets/images/расшир_табл.svg';

type SizeChartModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SizeChartVariant = 'classic' | 'expanded';

const SizeChartModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-30 bg-black/50"
    onClick={onClose}
    aria-label="Закрыть таблицу размеров"
    role="presentation"
  />
);

const SizeChartModalContent = ({ children, onClick }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void }) => (
  <div
    className="fixed inset-0 z-40 flex items-start justify-center pt-8"
    role="dialog"
    aria-modal="true"
    onClick={onClick}
  >
    <div
      className="w-[calc(100%-32px)] max-w-[480px] max-h-[90vh] overflow-y-auto rounded-[16px] bg-white p-4 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const SizeChartModalHeader = ({ onClose }: { onClose: () => void }) => (
  <div className="flex items-center justify-between">
    <p className="text-[18px] font-bold leading-[22px] text-[#29292B]">Таблица размеров</p>
    <button
      type="button"
      aria-label="Закрыть"
      onClick={onClose}
      className="text-[16px] font-semibold text-[#29292B] transition duration-150 ease-out hover:text-black"
    >
      ✕
    </button>
  </div>
);

const SizeChartVariantList = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 flex flex-col gap-4">{children}</div>
);

type SizeChartVariantItemProps = {
  id: SizeChartVariant;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  illustrationSrc: string;
  chartSrc: string;
};

const SizeChartVariantItem = ({ label, isOpen, onToggle, illustrationSrc, chartSrc }: SizeChartVariantItemProps) => (
  <div className="w-full">
    <button
      type="button"
      onClick={onToggle}
      className="flex h-11 w-full items-center justify-between rounded-[12px] border border-[#E5E5E5] bg-white px-4 py-2 text-left transition duration-150 ease-out hover:bg-[#F6F6F8] active:scale-[0.99]"
    >
      <span className="text-[15px] font-semibold text-[#29292B]">{label}</span>
      <svg
        className={`h-5 w-5 text-[#29292B] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>

    {isOpen ? (
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <img src={illustrationSrc} alt={`Схема измерений для ${label.toLowerCase()}`} className="h-[72px] w-auto" />
        </div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <img src={chartSrc} alt={`${label} BRACE`} className="block h-auto w-full" />
          </div>
        </div>
      </div>
    ) : null}
  </div>
);

const SizeChartModal = ({ isOpen, onClose }: SizeChartModalProps) => {
  const [isClassicOpen, setIsClassicOpen] = useState(true);
  const [isExpandedOpen, setIsExpandedOpen] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = () => onClose();

  return (
    <>
      <SizeChartModalOverlay onClose={handleOverlayClick} />
      <SizeChartModalContent onClick={handleOverlayClick}>
        <SizeChartModalHeader onClose={onClose} />
        <SizeChartVariantList>
          <SizeChartVariantItem
            id="classic"
            label="Классическая таблица"
            isOpen={isClassicOpen}
            onToggle={() => setIsClassicOpen((prev) => !prev)}
            illustrationSrc={boxersClassic}
            chartSrc={classicSizeChartSvg}
          />
          <SizeChartVariantItem
            id="expanded"
            label="Развернутая таблица"
            isOpen={isExpandedOpen}
            onToggle={() => setIsExpandedOpen((prev) => !prev)}
            illustrationSrc={boxersExtended}
            chartSrc={extendedSizeChartSvg}
          />
        </SizeChartVariantList>
      </SizeChartModalContent>
    </>
  );
};

export default SizeChartModal;
