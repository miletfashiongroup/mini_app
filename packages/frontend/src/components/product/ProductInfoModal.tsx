import React from 'react';

import { Modal } from '@/shared/ui/Modal';

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
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    {content}
  </Modal>
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
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    {content}
  </Modal>
);

export {
  ProductDescriptionModal,
  ProductCharacteristicsModal,
};
