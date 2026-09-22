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
  closeOnClickOutside?: boolean;
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
  closeOnClickOutside = true,
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const { popoverBackground, popoverStyle, themeColor } = useMapTool();
  const effectiveBg = backgroundColor ?? popoverBackground ?? themeColor;
  const isDark = isDarkColor(effectiveBg);

  useEffect(() => {
    if (!open || closeOnClickOutside === false) return;

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
  }, [open, anchorEl, onClose, closeOnClickOutside]);

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

  // If popover might overflow the bottom of the viewport, shift top upwards
  const estimatedHeight = 440;
  let adjustedTop = top;
  if (adjustedTop + estimatedHeight > window.innerHeight - padding) {
    adjustedTop = Math.max(padding, window.innerHeight - estimatedHeight - padding);
  }

  // Constrain within viewport boundaries
  const clampedLeft = Math.max(padding, Math.min(window.innerWidth - width - padding, left));
  const clampedTop = Math.max(padding, Math.min(window.innerHeight - 120, adjustedTop));
  const maxAvailableHeight = Math.max(160, window.innerHeight - clampedTop - padding * 2);

  return createPortal(
    <div
      ref={popoverRef}
      className={`mlt-popover ${isDark ? "mlt-dark" : ""} ${className}`.trim()}
      style={{
        position: "fixed",
        top: clampedTop,
        left: clampedLeft,
        width,
        maxHeight: maxAvailableHeight,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
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
