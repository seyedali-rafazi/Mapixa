// Main Library Component (Mapixa / MapLibreTools)
export { MapLibreTools, MapLibreTools as Mapixa } from "./components/MapLibreTools";
export type {
  MapLibreToolsProps,
  MapLibreToolsProps as MapixaProps,
} from "./components/MapLibreTools";

// Containers & Layout
export { MapControlBox } from "./components/MapControlBox";
export type { MapControlBoxProps } from "./components/MapControlBox";
export { ExpandableBox } from "./components/ExpandableBox";
export type { ExpandableBoxProps } from "./components/ExpandableBox";
export { ExtraActionButtons } from "./components/ExtraActionButtons";
export type { ExtraActionButtonsProps } from "./components/ExtraActionButtons";

// Layer Visibility
export { LayerVisibilityControl } from "./components/LayerVisibilityControl/LayerVisibilityControl";
export type { LayerVisibilityControlProps } from "./components/LayerVisibilityControl/LayerVisibilityControl";

// Draw Tools
export { MapDrawTools } from "./components/DrawTools/MapDrawTools";
export type { MapDrawToolsProps } from "./components/DrawTools/MapDrawTools";
export { DrawMarkerControl } from "./components/DrawTools/DrawMarkerControl";
export type { DrawMarkerControlProps, MarkerItem } from "./components/DrawTools/DrawMarkerControl";
export { DrawLineControl } from "./components/DrawTools/DrawLineControl";
export type { DrawLineControlProps, LineItem } from "./components/DrawTools/DrawLineControl";
export { DrawPolygonControl } from "./components/DrawTools/DrawPolygonControl";
export type { DrawPolygonControlProps, PolygonItem } from "./components/DrawTools/DrawPolygonControl";
export { DrawCircleControl } from "./components/DrawTools/DrawCircleControl";
export type { DrawCircleControlProps, CircleItem } from "./components/DrawTools/DrawCircleControl";
export { DrawRectangleControl } from "./components/DrawTools/DrawRectangleControl";
export type { DrawRectangleControlProps, RectangleItem } from "./components/DrawTools/DrawRectangleControl";
export { FreeDrawControl } from "./components/DrawTools/FreeDrawControl";
export type { FreeDrawControlProps } from "./components/DrawTools/FreeDrawControl";
export { IntersectionControl } from "./components/DrawTools/IntersectionControl";
export type { IntersectionControlProps } from "./components/DrawTools/IntersectionControl";

// Extra Tools
export { ExtraMapTools } from "./components/ExtraTools/ExtraMapTools";
export type { ExtraMapToolsProps } from "./components/ExtraTools/ExtraMapTools";
export { DrawRulerControl } from "./components/ExtraTools/DrawRulerControl";
export type { DrawRulerControlProps } from "./components/ExtraTools/DrawRulerControl";
export { CaptureAreaControl } from "./components/ExtraTools/CaptureAreaControl";
export type { CaptureAreaControlProps } from "./components/ExtraTools/CaptureAreaControl";
export { GoToControl } from "./components/ExtraTools/GoToControl";
export type { GoToControlProps } from "./components/ExtraTools/GoToControl";
export { ImageOverlayControl } from "./components/ExtraTools/ImageOverlayControl";
export type { ImageOverlayControlProps, OverlayImageItem } from "./components/ExtraTools/ImageOverlayControl";

// Navigation Tools
export { MapNavigator } from "./components/NavigationTools/MapNavigator";
export type { MapNavigatorProps } from "./components/NavigationTools/MapNavigator";
export { CoordinateDisplay } from "./components/NavigationTools/CoordinateDisplay";
export type { CoordinateDisplayProps } from "./components/NavigationTools/CoordinateDisplay";
export { MapViewControl } from "./components/NavigationTools/MapViewControl";
export { MapFlatViewEnforcer } from "./components/NavigationTools/MapFlatViewEnforcer";
export { MapResizeHandler } from "./components/NavigationTools/MapResizeHandler";

// Contexts & Hooks
export {
  MapToolProvider,
  useMapTool,
  useExclusiveTool,
} from "./context/MapToolContext";
export type {
  ActiveTool,
  MapToolContextValue,
  MapToolProviderProps,
} from "./context/MapToolContext";

export {
  LayerVisibilityProvider,
  useLayerVisibility,
  TOOL_LAYER_MAP,
} from "./context/LayerVisibilityContext";
export type {
  LayerVisibilityContextValue,
  LayerVisibilityProviderProps,
} from "./context/LayerVisibilityContext";

export {
  AccordionGroupProvider,
  useAccordionGroupItem,
} from "./context/AccordionGroupContext";

// Types
export type {
  ToolType,
  AfterDrawMode,
  ToolMetrics,
  ActionContext,
  ExtraActionItem,
  LayerVisibilityState,
  ToolConfig,
  ToolsConfiguration,
} from "./types/tools";

export type {
  DrawEndEvent,
  DrawChangeEvent,
  DrawDeleteEvent,
  LayerVisibilityChangeEvent,
} from "./types/events";

// Utilities
export {
  calculateDistanceKm,
  calculateLineDistanceKm,
  calculatePolygonAreaSqM,
  createGeoJSONCircle,
  getMidpoint,
  getLineIntersection,
} from "./utils/geoCalculations";

export {
  downloadGeoJSON,
  copyToClipboard,
  downloadCanvasArea,
} from "./utils/exportUtils";

export { generateMarkerSvg } from "./utils/generateMarkerSvg";
export type { MarkerSvgConfig } from "./utils/generateMarkerSvg";

export {
  getMapToolButtonStyle,
  getMapToolButtonSx,
  getMapToolAccordionButtonSx,
} from "./utils/mapToolButtonStyles";

// UI Components & Icons
export { Modal } from "./components/ui/Modal";
export type { ModalProps } from "./components/ui/Modal";
export { Popover } from "./components/ui/Popover";
export type { PopoverProps } from "./components/ui/Popover";
export * from "./components/ui/Icons";


// Default export
import MapLibreTools from "./components/MapLibreTools";
export default MapLibreTools;
