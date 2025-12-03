import React from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-20 bg-black/50"
        role="presentation"
        aria-label="Закрыть модалку"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-30 flex items-start justify-center pt-6">
        <div
          className="w-[calc(100%-32px)] max-w-[520px] max-h-[80vh] overflow-y-auto rounded-[16px] bg-white p-4 shadow-xl"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {title ? (
            <div className="flex items-center justify-between">
              <p className="text-[18px] font-bold leading-[22px] text-text-primary">{title}</p>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={onClose}
                className="text-[16px] font-semibold text-text-primary transition duration-150 ease-out hover:text-black"
              >
                ×
              </button>
            </div>
          ) : null}
          <div className="mt-4 max-h-[calc(80vh-56px)] overflow-y-auto text-[14px] leading-relaxed text-text-primary">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
