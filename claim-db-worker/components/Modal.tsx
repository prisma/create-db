import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] overflow-hidden">
      <div
        className={`bg-card border border-subtle rounded-lg p-6 ${maxWidth} w-full mx-4 max-h-[90vh] overflow-y-auto`}
      >
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

export default Modal;
