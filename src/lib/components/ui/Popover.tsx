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
  placement?: "left" | "right" | "top" | "bottom" | "auto";
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
  placement = "auto",
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
  const padding = 10;

  // Determine effective placement
  let effectivePlacement = placement;
  if (!effectivePlacement || effectivePlacement === "auto") {
    const anchorCenter = rect.left + rect.width / 2;
    effectivePlacement = anchorCenter < window.innerWidth / 2 ? "right" : "left";
  }

  let top = rect.top;
  let left = rect.left;

  switch (effectivePlacement) {
    case "right":
      left = rect.right + padding;
      top = rect.top;
      break;
    case "bottom":
      left = rect.left + rect.width / 2 - width / 2;
      top = rect.bottom + padding;
      break;
    case "top":
      left = rect.left + rect.width / 2 - width / 2;
      top = rect.top - padding;
      break;
    case "left":
    default:
      left = rect.left - width - padding;
      top = rect.top;
      break;
  }

  // Constrain within viewport boundaries
  const clampedLeft = Math.max(padding, Math.min(window.innerWidth - width - padding, left));
  const clampedTop = Math.max(padding, Math.min(window.innerHeight - 80, top));

  return createPortal(
    <div
      ref={popoverRef}
      className={`mlt-popover ${isDark ? "mlt-dark" : ""} ${className}`.trim()}
      style={{
        position: "fixed",
        top: clampedTop,
        left: clampedLeft,
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
