import { useEffect } from 'react';

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
};

export const SizeSelectModal = ({
  isOpen,
  sizes,
  selectedSize,
  onSelectSize,
  onClose,
  onConfirm,
  isSubmitting = false,
}: SizeSelectModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedSize && sizes.length) {
      onSelectSize(sizes[0]);
    }
  }, [isOpen, onSelectSize, selectedSize, sizes]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Выберите размер">
      {sizes.length ? (
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
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
          className="w-full"
          onClick={onConfirm}
          disabled={!sizes.length || !selectedSize || isSubmitting}
        >
          Добавить в корзину
        </Button>
      </div>
    </Modal>
  );
};
