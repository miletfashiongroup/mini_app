import { useEffect, useMemo } from 'react';

import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type SizeSelectModalProps = {
  isOpen: boolean;
  sizes: string[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  title?: string;
  confirmLabel?: string;
};

export const SizeSelectModal = ({
  isOpen,
  sizes,
  selectedSize,
  onSelectSize,
  onClose,
  onConfirm,
  isSubmitting = false,
  title = 'Выберите размер',
  confirmLabel = 'Добавить в корзину',
}: SizeSelectModalProps) => {
  const sortedSizes = useMemo(() => {
    return [...sizes].sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
        return aNum - bNum;
      }
      if (Number.isFinite(aNum)) return -1;
      if (Number.isFinite(bNum)) return 1;
      return String(a).localeCompare(String(b), 'ru');
    });
  }, [sizes]);

  useEffect(() => {
    if (!isOpen) return;
    if ((!selectedSize || !sortedSizes.includes(selectedSize)) && sortedSizes.length) {
      onSelectSize(sortedSizes[0]);
    }
  }, [isOpen, onSelectSize, selectedSize, sortedSizes]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {sortedSizes.length ? (
        <div className="flex flex-wrap gap-2">
          {sortedSizes.map((size) => {
            const isActive = size === selectedSize;
            return (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                className={`min-w-[64px] rounded-full border px-4 py-2 text-[14px] font-semibold transition ${
                  isActive ? 'border-black bg-black text-white' : 'border-[#D9D9D9] bg-white text-[#29292B]'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[14px] text-[#5A5A5C]">Нет доступных размеров.</p>
      )}
      <div className="mt-4">
        <Button
          variant="primary"
          className="w-full h-12 text-[16px]"
          onClick={onConfirm}
          disabled={!sortedSizes.length || !selectedSize || isSubmitting}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
