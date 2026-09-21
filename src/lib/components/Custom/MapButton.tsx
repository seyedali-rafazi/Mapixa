import { type FC, type ReactNode, type MouseEvent } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { ControlPosition } from "react-map-gl/maplibre";
import { useAccordionContext } from "../../context/AccordionContext";
import MapControlBox from "../MapControlBox";
import { isDarkColor } from "../../utils/colorUtils";

export interface MapButtonProps {
  /**
   * Button icon element
   */
  icon?: ReactNode;
  /**
   * Children content (can be used instead of or alongside icon)
   */
  children?: ReactNode;
  /**
   * Tooltip or accessible label
   */
  tooltip?: string;
  /**
   * Title text (fallback for tooltip)
   */
  title?: string;
  /**
   * Optional text label
   */
  label?: string;
  /**
   * Whether the button is currently in an active / toggled state
   */
  active?: boolean;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Click event handler. Provides the active maplibregl.Map instance as the second argument.
   */
  onClick?: (event: MouseEvent<HTMLButtonElement>, map?: any) => void;
  /**
   * Map control position.
   * If specified (e.g. 'bottom-right', 'top-left'), forces standalone floating mode on the map.
   * If omitted and inside an accordion, renders as an accordion tool item.
   */
  position?: ControlPosition;
  /**
   * Margin for the control box when rendered in standalone position
   */
  margin?: { top: number; bottom: number; left: number; right: number };
  /**
   * Background color override
   */
  backgroundColor?: string;
  /**
   * Text / Icon color override
   */
  color?: string;
  /**
   * Custom button size in pixels (defaults to 36 in accordion, 32 in standalone panel)
   */
  size?: number;
  /**
   * Optional badge indicator (e.g. count or dot)
   */
  badge?: string | number;
  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Unique identifier
   */
  id?: string;
}

export const MapButton: FC<MapButtonProps> = ({
  icon,
  children,
  tooltip,
  title,
  label,
  active = false,
  disabled = false,
  onClick,
  position,
  margin,
  backgroundColor,
  color,
  size,
  badge,
  style,
  className = "",
  id,
}) => {
  const { isInAccordion } = useAccordionContext();
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const isStandalone = Boolean(position) || !isInAccordion;
  const isDark = isDarkColor(backgroundColor);
  const effectiveTooltip = tooltip || title || label;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e, map);
  };

  const buttonSize = size ?? (isStandalone ? 32 : 36);

  const buttonElement = (
    <button
      id={id}
      type="button"
      className={`mlt-icon-btn ${active ? "active mlt-icon-btn-active" : ""} ${className}`.trim()}
      style={{
        width: buttonSize,
        height: buttonSize,
        position: "relative",
        ...(color ? { color } : {}),
        ...(!isStandalone ? style : {}),
      }}
      onClick={handleClick}
      title={effectiveTooltip}
      aria-label={effectiveTooltip}
      disabled={disabled}
    >
      {icon}
      {children}
      {label && !icon && !children && (
        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{label}</span>
      )}
      {badge !== undefined && (
        <span className="mlt-button-badge">
          {badge}
        </span>
      )}
    </button>
  );

  if (isStandalone) {
    return (
      <MapControlBox position={position ?? "bottom-right"} margin={margin}>
        <div
          className={`mlt-panel mlt-view-control ${isDark ? "mlt-dark" : ""}`.trim()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "4px",
            width: "fit-content",
            ...(backgroundColor ? { background: backgroundColor } : {}),
            ...style,
          }}
        >
          {buttonElement}
        </div>
      </MapControlBox>
    );
  }

  return buttonElement;
};

export default MapButton;
