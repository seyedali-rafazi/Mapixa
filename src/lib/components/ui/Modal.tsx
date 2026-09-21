import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";
import { isDarkColor } from "../../utils/colorUtils";
import { useMapTool } from "../../context/MapToolContext";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 420,
  backgroundColor,
  style,
  className = "",
}: ModalProps) => {
  const { modalBackground, modalStyle, themeColor } = useMapTool();
  const effectiveBg = backgroundColor ?? modalBackground ?? themeColor;
  const isDark = isDarkColor(effectiveBg);

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
      <div
        className={`mlt-modal ${isDark ? "mlt-dark" : ""} ${className}`.trim()}
        style={{
          maxWidth,
          ...(effectiveBg ? { background: effectiveBg } : {}),
          ...modalStyle,
          ...style,
        }}
      >
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
