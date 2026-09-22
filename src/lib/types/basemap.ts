import type { ReactNode } from "react";
import type { ControlPosition } from "react-map-gl/maplibre";

export interface BasemapLayerItem {
  id: string;
  name: string;
  style: string | any;
  thumbnail?: string;
  icon?: ReactNode;
  description?: string;
  /**
   * If true, this base map will be selected and applied to the map as default
   */
  default?: boolean;
}

export interface BasemapOverlayItem {
  id: string;
  name: string;
  style?: string | any;
  opacity?: number;
  source?: any;
  layers?: any[];
  icon?: ReactNode;
  description?: string;
  /**
   * If true, this overlay will be active by default on map load
   */
  default?: boolean;
}

export interface BasemapSwitcherProps {
  /**
   * List of base map layers (singular prop name as requested)
   */
  layer?: BasemapLayerItem[];
  /**
   * List of base map layers (plural alias)
   */
  layers?: BasemapLayerItem[];
  /**
   * List of overlay layers (singular prop name as requested)
   */
  overlay?: BasemapOverlayItem[];
  /**
   * List of overlay layers (plural alias)
   */
  overlays?: BasemapOverlayItem[];

  /**
   * Initial active basemap layer ID
   */
  defaultLayerId?: string;
  /**
   * Controlled active basemap layer ID
   */
  activeLayerId?: string;
  /**
   * Callback fired when a basemap layer is selected
   */
  onLayerChange?: (layer: BasemapLayerItem) => void;

  /**
   * Initial active overlay IDs
   */
  defaultOverlayIds?: string[];
  /**
   * Controlled active overlay IDs
   */
  activeOverlayIds?: string[];
  /**
   * Callback fired when active overlays change
   */
  onOverlayChange?: (activeOverlayIds: string[]) => void;

  /**
   * Control position when rendered as a standalone floating button (e.g. 'bottom-right', 'top-left').
   * If omitted and inside an accordion, renders as an accordion item.
   * If inNavigator is true, renders embedded inside the MapNavigator panel.
   */
  position?: ControlPosition;
  /**
   * Set to true to embed cleanly inside the MapNavigator control panel
   */
  inNavigator?: boolean;
  /**
   * Alias for inNavigator
   */
  embedded?: boolean;

  /**
   * Margin for the control box when rendered in a standalone position
   */
  margin?: { top: number; bottom: number; left: number; right: number };

  /**
   * Button icon override (defaults to LayersIcon)
   */
  icon?: ReactNode;
  /**
   * Tooltip label (defaults to "Basemap & Overlays")
   */
  tooltip?: string;
  /**
   * Title text in the popover header (defaults to "Basemap & Overlays")
   */
  title?: string;
  /**
   * Button size in pixels (defaults to 36 in accordion, 32 in navigator or standalone)
   */
  size?: number;
  /**
   * Width of the popover in pixels (defaults to 280)
   */
  width?: number;
  /**
   * Placement of the popover relative to the trigger button
   */
  popoverPlacement?: "left" | "right" | "top" | "bottom" | "auto";

  /**
   * Background color override
   */
  backgroundColor?: string;
  /**
   * Text/icon color override
   */
  color?: string;
  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;
  /**
   * Custom CSS class name
   */
  className?: string;
  /**
   * Optional HTML id
   */
  id?: string;
}
