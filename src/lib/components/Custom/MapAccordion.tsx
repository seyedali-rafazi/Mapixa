import { type FC, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ControlPosition } from "react-map-gl/maplibre";
import { ExpandableBox } from "../ExpandableBox";
import { MapControlBox } from "../MapControlBox";
import { useToolbarContext } from "../../context/ToolbarContext";
import { AccordionGroupProvider } from "../../context/AccordionGroupContext";

export interface MapAccordionProps {
  /**
   * Title text displayed on the collapsed accordion button
   */
  title?: string;
  /**
   * Label alias for title
   */
  label?: string;
  /**
   * Text alias for title
   */
  accordionText?: string;
  /**
   * Icon displayed on the collapsed accordion button
   */
  icon?: ReactNode;
  /**
   * Icon alias
   */
  accordionIcon?: ReactNode;
  /**
   * Unique ID for accordion group tracking. Defaults to title.
   */
  id?: string;
  /**
   * Tooltip displayed on hover
   */
  tooltip?: string;
  /**
   * Optional footer component at the bottom of the accordion
   */
  footer?: ReactNode;
  /**
   * Control position on the map.
   * If omitted or 'toolbar', mounts/portals seamlessly into the main Mapixa toolbar column.
   * If a ControlPosition (e.g. 'top-left', 'bottom-right') is given, renders at that map position.
   */
  position?: ControlPosition | "toolbar";
  /**
   * Margin for the control box when rendered at a specific map position
   */
  margin?: { top: number; bottom: number; left: number; right: number };
  /**
   * Background color override for the accordion
   */
  backgroundColor?: string;
  /**
   * Alias for backgroundColor
   */
  accordionBackground?: string;
  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * If true, this accordion operates independently and won't auto-close when other accordions open
   */
  independent?: boolean;
  /**
   * Children items (MapButton, built-in tool controls, or custom React elements)
   */
  children?: ReactNode;
}

export const MapAccordion: FC<MapAccordionProps> = ({
  title,
  label,
  accordionText,
  icon,
  accordionIcon,
  id,
  tooltip,
  footer,
  position,
  margin,
  backgroundColor,
  accordionBackground,
  style,
  className = "",
  independent = false,
  children,
}) => {
  const { toolbarElement } = useToolbarContext();

  const effectiveTitle = title ?? label ?? accordionText ?? "TOOLS";
  const effectiveIcon = icon ?? accordionIcon;
  const effectiveId = id ?? effectiveTitle;
  const effectiveBg = accordionBackground ?? backgroundColor;

  const boxContent = (
    <ExpandableBox
      id={effectiveId}
      accordionText={effectiveTitle}
      accordionIcon={effectiveIcon}
      tooltip={tooltip}
      footer={footer}
      backgroundColor={effectiveBg}
      style={style}
      className={className}
    >
      {children}
    </ExpandableBox>
  );

  const wrappedContent = independent ? (
    <AccordionGroupProvider>{boxContent}</AccordionGroupProvider>
  ) : (
    boxContent
  );

  // If a specific map control position is requested (other than 'toolbar')
  if (position && position !== "toolbar") {
    return (
      <MapControlBox position={position} margin={margin}>
        {wrappedContent}
      </MapControlBox>
    );
  }

  // If inside MapLibreTools with a toolbar container, portal into the toolbar flex container
  if (toolbarElement) {
    return createPortal(wrappedContent, toolbarElement);
  }

  // Fallback: standalone in top-right
  return (
    <MapControlBox position="top-right" margin={margin}>
      {wrappedContent}
    </MapControlBox>
  );
};

export default MapAccordion;
