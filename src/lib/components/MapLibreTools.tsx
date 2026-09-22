import { useState, type FC, type ReactNode } from "react";
import type { ControlPosition } from "react-map-gl/maplibre";
import "../styles/map-tools.css";
import { MapToolProvider } from "../context/MapToolContext";
import { LayerVisibilityProvider } from "../context/LayerVisibilityContext";
import { AccordionGroupProvider } from "../context/AccordionGroupContext";
import ToolbarContext from "../context/ToolbarContext";
import MapControlBox from "./MapControlBox";
import MapDrawTools from "./DrawTools/MapDrawTools";
import ExtraMapTools from "./ExtraTools/ExtraMapTools";
import MapNavigator from "./NavigationTools/MapNavigator";
import CoordinateDisplay from "./NavigationTools/CoordinateDisplay";
import MapViewControl from "./NavigationTools/MapViewControl";
import MapFlatViewEnforcer from "./NavigationTools/MapFlatViewEnforcer";
import MapResizeHandler from "./NavigationTools/MapResizeHandler";
import MapButton from "./Custom/MapButton";
import MapAccordion from "./Custom/MapAccordion";
import BasemapSwitcher from "./NavigationTools/BasemapSwitcher";
import type {
  BasemapLayerItem,
  BasemapOverlayItem,
  BasemapSwitcherProps,
} from "../types/basemap";
import type {
  ToolsConfiguration,
  LayerVisibilityState,
  AfterDrawMode,
  ExtraActionItem,
  ToolType,
} from "../types/tools";
import type { DrawEndEvent, DrawChangeEvent, DrawDeleteEvent } from "../types/events";

export interface MapLibreToolsProps {
  children?: ReactNode;
  /**
   * Position for the main draw and extra toolbars.
   * Defaults to 'top-right'
   */
  toolbarPosition?: ControlPosition;
  /**
   * Position for navigator zoom/home controls.
   * Defaults to 'top-left'
   */
  navigatorPosition?: ControlPosition;
  /**
   * Position for live coordinate display.
   * Defaults to 'bottom-left'
   */
  coordinatePosition?: ControlPosition;
  /**
   * Position for fullscreen control.
   * Defaults to 'bottom-right'
   */
  viewControlPosition?: ControlPosition;
  /**
   * Controlled or initial visibility of tool layers (markers, lines, polygons, etc.)
   * Example: visibility={{ polyine: true, circle: false }} or visibility={{ line: true, circle: false }}
   */
  visibility?: Partial<LayerVisibilityState>;
  /**
   * Initial visibility of tool layers (fallback for uncontrolled)
   */
  initialVisibility?: Partial<LayerVisibilityState>;
  /**
   * Gap between toolbar accordion boxes in pixels.
   * Defaults to 12.
   */
  toolbarGap?: number;
  /**
   * Tool configurations (enabled/disabled, custom extraActions per tool)
   */
  toolsConfig?: ToolsConfiguration;
  /**
   * Behavior after finishing a draw action:
   * - 'modal': opens configuration/styling modal with extra actions
   * - 'auto-save': automatically commits the feature and triggers onDrawEnd
   * - 'callback': triggers onDrawEnd immediately
   */
  afterDrawMode?: AfterDrawMode;
  /**
   * Global extra actions injected into all tool modals
   */
  extraActions?: ExtraActionItem[];
  /**
   * Callback fired when any tool finishes drawing a shape, marker, or measurement
   */
  onDrawEnd?: (event: DrawEndEvent) => void;
  /**
   * Callback fired when a tool starts drawing
   */
  onDrawStart?: (tool: ToolType) => void;
  /**
   * Callback fired when features change
   */
  onDrawChange?: (event: DrawChangeEvent) => void;
  /**
   * Callback fired when a feature is deleted
   */
  onDrawDelete?: (event: DrawDeleteEvent) => void;
  /**
   * Callback fired when layer visibility toggles
   */
  onVisibilityChange?: (
    tool: ToolType,
    visible: boolean,
    allState: LayerVisibilityState
  ) => void;

  showDrawTools?: boolean;
  showExtraTools?: boolean;
  showNavigator?: boolean;
  showCoordinates?: boolean;
  showFullscreen?: boolean;
  enforceFlatView?: boolean;
  autoResize?: boolean;

  showBasemapSwitcher?: boolean;
  basemapLayers?: BasemapLayerItem[];
  basemapOverlays?: BasemapOverlayItem[];
  basemapSwitcherProps?: Partial<BasemapSwitcherProps>;

  /**
   * Background color or CSS value for accordion toolbars (Draw & Extra tools).
   * Example: "#1e1e1e", "rgba(255, 255, 255, 0.9)", "linear-gradient(...)"
   */
  accordionBackground?: string;
  accordionBg?: string;
  accordionStyle?: React.CSSProperties;

  /**
   * Background color or CSS value for the coordinate display panel.
   */
  coordinateBackground?: string;
  coordinateBg?: string;
  coordinateStyle?: React.CSSProperties;

  /**
   * Background color or CSS value for the map navigator controls.
   */
  navigatorBackground?: string;
  navigatorBg?: string;
  navigatorStyle?: React.CSSProperties;

  /**
   * Background color or CSS value for the fullscreen view control.
   */
  fullscreenBackground?: string;
  fullscreenBg?: string;
  fullscreenStyle?: React.CSSProperties;

  /**
   * Background color or CSS value for tool modal dialogs.
   */
  modalBackground?: string;
  modalBg?: string;
  modalStyle?: React.CSSProperties;

  /**
   * Background color or CSS value for floating popovers (e.g. layer visibility).
   */
  popoverBackground?: string;
  popoverBg?: string;
  popoverStyle?: React.CSSProperties;

  /**
   * Shared background color applied to all controls and modals.
   */
  color?: string;

  /**
   * Map of custom background colors for controls and modals.
   */
  colors?: {
    accordion?: string;
    coordinate?: string;
    navigator?: string;
    fullscreen?: string;
    modal?: string;
    popover?: string;
  };
}

const MapLibreToolsBase: FC<MapLibreToolsProps> = ({
  children,
  toolbarPosition = "top-right",
  navigatorPosition = "top-left",
  coordinatePosition = "bottom-left",
  viewControlPosition = "bottom-right",
  visibility,
  initialVisibility,
  toolbarGap = 12,
  toolsConfig,
  afterDrawMode = "modal",
  extraActions,
  onDrawEnd,
  onDrawStart,
  onDrawChange,
  onDrawDelete,
  onVisibilityChange,
  showDrawTools = true,
  showExtraTools = true,
  showNavigator = true,
  showCoordinates = true,
  showFullscreen = true,
  enforceFlatView = true,
  autoResize = true,
  showBasemapSwitcher = false,
  basemapLayers,
  basemapOverlays,
  basemapSwitcherProps,
  accordionBackground,
  accordionBg,
  accordionStyle,
  coordinateBackground,
  coordinateBg,
  coordinateStyle,
  navigatorBackground,
  navigatorBg,
  navigatorStyle,
  fullscreenBackground,
  fullscreenBg,
  fullscreenStyle,
  modalBackground,
  modalBg,
  modalStyle,
  popoverBackground,
  popoverBg,
  popoverStyle,
  color,
  colors,
}) => {
  const [toolbarElement, setToolbarElement] = useState<HTMLElement | null>(null);

  const effectiveAccordionBg = colors?.accordion ?? accordionBackground ?? accordionBg ?? color;
  const effectiveCoordinateBg = colors?.coordinate ?? coordinateBackground ?? coordinateBg ?? color;
  const effectiveNavigatorBg = colors?.navigator ?? navigatorBackground ?? navigatorBg ?? color;
  const effectiveFullscreenBg = colors?.fullscreen ?? fullscreenBackground ?? fullscreenBg ?? color;
  const effectiveModalBg = colors?.modal ?? modalBackground ?? modalBg ?? color;
  const effectivePopoverBg = colors?.popover ?? popoverBackground ?? popoverBg ?? color;

  return (
    <MapToolProvider
      toolsConfig={toolsConfig}
      afterDrawMode={afterDrawMode}
      extraActions={extraActions}
      onDrawEnd={onDrawEnd}
      onDrawStart={onDrawStart}
      onDrawChange={onDrawChange}
      onDrawDelete={onDrawDelete}
      themeColor={color}
      modalBackground={effectiveModalBg}
      modalStyle={modalStyle}
      popoverBackground={effectivePopoverBg}
      popoverStyle={popoverStyle}
    >
      <LayerVisibilityProvider
        visibility={visibility}
        initialVisibility={initialVisibility}
        onVisibilityChange={onVisibilityChange}
      >
        <AccordionGroupProvider>
          <ToolbarContext.Provider value={{ toolbarElement, setToolbarElement }}>
            {enforceFlatView && <MapFlatViewEnforcer />}
            {autoResize && <MapResizeHandler />}

            {/* Navigator Box */}
            {showNavigator && (
              <MapControlBox position={navigatorPosition}>
                <MapNavigator
                  backgroundColor={effectiveNavigatorBg}
                  style={navigatorStyle}
                  showBasemapSwitcher={showBasemapSwitcher}
                  basemapLayers={basemapLayers}
                  basemapOverlays={basemapOverlays}
                  basemapSwitcherProps={basemapSwitcherProps}
                />
              </MapControlBox>
            )}

            {/* Main Drawing & Extra Tools Toolbar with pure CSS flex gap */}
            <MapControlBox position={toolbarPosition}>
              <div
                ref={setToolbarElement as any}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: `${toolbarGap}px`,
                }}
              >
                {showDrawTools && (
                  <MapDrawTools
                    config={toolsConfig}
                    extraActions={extraActions}
                    accordionBackground={effectiveAccordionBg}
                    style={accordionStyle}
                  />
                )}
                {showExtraTools && (
                  <ExtraMapTools
                    config={toolsConfig}
                    extraActions={extraActions}
                    accordionBackground={effectiveAccordionBg}
                    style={accordionStyle}
                  />
                )}
              </div>
            </MapControlBox>

            {/* Coordinates readout */}
            {showCoordinates && (
              <MapControlBox position={coordinatePosition}>
                <CoordinateDisplay
                  backgroundColor={effectiveCoordinateBg}
                  style={coordinateStyle}
                />
              </MapControlBox>
            )}

            {/* View / Fullscreen */}
            {showFullscreen && (
              <MapControlBox position={viewControlPosition}>
                <MapViewControl
                  backgroundColor={effectiveFullscreenBg}
                  style={fullscreenStyle}
                />
              </MapControlBox>
            )}

            {children}
          </ToolbarContext.Provider>
        </AccordionGroupProvider>
      </LayerVisibilityProvider>
    </MapToolProvider>
  );
};

// Compound component properties for convenient wrapper usage
export type MapLibreToolsComponent = FC<MapLibreToolsProps> & {
  Button: typeof MapButton;
  Accordion: typeof MapAccordion;
  ControlBox: typeof MapControlBox;
  DrawTools: typeof MapDrawTools;
  ExtraTools: typeof ExtraMapTools;
  Navigator: typeof MapNavigator;
  Coordinates: typeof CoordinateDisplay;
  Fullscreen: typeof MapViewControl;
  BasemapSwitcher: typeof BasemapSwitcher;
};

export const MapLibreTools = MapLibreToolsBase as unknown as MapLibreToolsComponent;
MapLibreTools.Button = MapButton;
MapLibreTools.Accordion = MapAccordion;
MapLibreTools.ControlBox = MapControlBox;
MapLibreTools.DrawTools = MapDrawTools;
MapLibreTools.ExtraTools = ExtraMapTools;
MapLibreTools.Navigator = MapNavigator;
MapLibreTools.Coordinates = CoordinateDisplay;
MapLibreTools.Fullscreen = MapViewControl;
MapLibreTools.BasemapSwitcher = BasemapSwitcher;

export default MapLibreTools;
