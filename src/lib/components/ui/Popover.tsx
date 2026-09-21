import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isDarkColor } from "../../utils/colorUtils";
import { useMapTool } from "../../context/MapToolContext";

export interface PopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  backgroundColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Popover = ({
  open,
  anchorEl,
  onClose,
  children,
  width = 240,
  backgroundColor,
  style,
  className = "",
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const { popoverBackground, popoverStyle, themeColor } = useMapTool();
  const effectiveBg = backgroundColor ?? popoverBackground ?? themeColor;
  const isDark = isDarkColor(effectiveBg);

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
      className={`mlt-popover ${isDark ? "mlt-dark" : ""} ${className}`.trim()}
      style={{
        position: "fixed",
        top: Math.max(10, top),
        left: Math.max(10, left),
        width,
        ...(effectiveBg ? { background: effectiveBg } : {}),
        ...popoverStyle,
        ...style,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;
