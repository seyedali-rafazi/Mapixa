import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export const Popover = ({
  open,
  anchorEl,
  onClose,
  children,
  width = 240,
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorEl &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, anchorEl, onClose]);

  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  // Open to the left of the button
  const top = rect.top;
  const left = rect.left - width - 10;

  return createPortal(
    <div
      ref={popoverRef}
      className="mlt-popover"
      style={{
        position: "fixed",
        top: Math.max(10, top),
        left: Math.max(10, left),
        width,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;
