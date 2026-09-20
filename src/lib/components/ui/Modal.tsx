import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 420,
}: ModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="mlt-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mlt-modal" style={{ maxWidth }}>
        <div className="mlt-modal-header">
          <span>{title}</span>
          <button
            className="mlt-icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="mlt-modal-body">{children}</div>

        {footer && <div className="mlt-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
