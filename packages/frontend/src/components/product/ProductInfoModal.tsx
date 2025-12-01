import React from 'react';

type ProductInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const ProductInfoModalOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-20 bg-black/50" role="presentation" aria-label="Закрыть модалку" onClick={onClose} />
);

const ProductInfoModalContent = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-30 flex items-start justify-center pt-6">
    <div
      className="w-[calc(100%-32px)] max-w-[520px] max-h-[80vh] overflow-y-auto rounded-[16px] bg-white p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <p className="text-[18px] font-bold leading-[22px] text-[#29292B]">{title}</p>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="text-[16px] font-semibold text-[#29292B] transition duration-150 ease-out hover:text-black"
        >
          ×
        </button>
      </div>
      <div className="mt-4 max-h-[calc(80vh-56px)] overflow-y-auto text-[14px] leading-relaxed text-[#29292B]">
        {children}
      </div>
    </div>
  </div>
);

const ProductInfoModal = ({ isOpen, onClose, title, children }: ProductInfoModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <ProductInfoModalOverlay onClose={onClose} />
      <ProductInfoModalContent title={title} onClose={onClose}>
        {children}
      </ProductInfoModalContent>
    </>
  );
};

const ProductDescriptionModal = ({
  isOpen,
  onClose,
  title = 'Описание',
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: React.ReactNode;
}) => (
  <ProductInfoModal isOpen={isOpen} onClose={onClose} title={title}>
    {content}
  </ProductInfoModal>
);

const ProductCharacteristicsModal = ({
  isOpen,
  onClose,
  title = 'Характеристики',
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: React.ReactNode;
}) => (
  <ProductInfoModal isOpen={isOpen} onClose={onClose} title={title}>
    {content}
  </ProductInfoModal>
);

export {
  ProductInfoModal,
  ProductInfoModalOverlay,
  ProductInfoModalContent,
  ProductDescriptionModal,
  ProductCharacteristicsModal,
};
