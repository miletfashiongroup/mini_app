import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Fragment } from 'react';

import { Button } from '@/shared/ui/Button';

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
};

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
}: ModalProps) => (
  <Transition.Root show={open} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-brand-black/50 backdrop-blur" />
      </Transition.Child>

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4 text-gray-dark">
              <Dialog.Title className="text-2xl font-semibold">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-gray-dark/70">
                  {description}
                </Dialog.Description>
              )}
              {children}
              {(primaryAction || secondaryAction) && (
                <div className={clsx('flex gap-3', secondaryAction ? 'justify-between' : 'justify-end')}>
                  {secondaryAction && (
                    <Button variant="ghost" onClick={secondaryAction.onPress}>
                      {secondaryAction.label}
                    </Button>
                  )}
                  {primaryAction && (
                    <Button
                      variant="primary"
                      onClick={primaryAction.onPress}
                      disabled={primaryAction.loading}
                    >
                      {primaryAction.loading ? 'Подождите…' : primaryAction.label}
                    </Button>
                  )}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition.Root>
);

