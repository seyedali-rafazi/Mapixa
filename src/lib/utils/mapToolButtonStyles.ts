import type { CSSProperties } from "react";

export const getMapToolButtonStyle = (
  isActive: boolean,
  size = 36
): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: "10px",
  color: isActive ? "#ffffff" : "#86868b",
  backgroundColor: isActive ? "#007aff" : "transparent",
  boxShadow: isActive ? "0 4px 12px rgba(0, 122, 255, 0.35)" : "none",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxSizing: "border-box",
  padding: 0,
});

// Backward compatibility alias
export const getMapToolButtonSx = getMapToolButtonStyle;
export const getMapToolAccordionButtonSx = getMapToolButtonStyle;
