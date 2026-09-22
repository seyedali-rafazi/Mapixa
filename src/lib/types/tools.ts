import type { ReactNode } from "react";

export type ToolType =
  | "marker"
  | "line"
  | "polygon"
  | "circle"
  | "rectangle"
  | "freedraw"
  | "ruler"
  | "capture"
  | "goto"
  | "overlay"
  | "intersection";

export type AfterDrawMode = "modal" | "auto-save" | "callback";

export interface ToolMetrics {
  distanceKm?: number;
  areaSqM?: number;
  areaSqKm?: number;
  radiusKm?: number;
  perimeterKm?: number;
  pointCount?: number;
}

export interface ActionContext {
  tool: ToolType;
  feature?: any;
  coordinates?: any;
  properties?: Record<string, any>;
  metrics?: ToolMetrics;
  map?: any;
  closeModal?: () => void;
}

export interface ExtraActionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  tooltip?: string;
  onClick: (context: ActionContext) => void | Promise<void>;
}

export interface LayerVisibilityState {
  marker: boolean;
  line: boolean;
  polygon: boolean;
  circle: boolean;
  rectangle: boolean;
  freedraw: boolean;
  ruler: boolean;
  overlay: boolean;
  intersection?: boolean;
  [key: string]: boolean | undefined;
}

export interface ToolConfig {
  enabled?: boolean;
  visible?: boolean;
  extraActions?: ExtraActionItem[];
  afterDrawMode?: AfterDrawMode;
}

export type DrawnToolType =
  | "marker"
  | "line"
  | "polygon"
  | "circle"
  | "rectangle"
  | "freedraw"
  | "intersection";

export interface DrawnLayerItem {
  id: string;
  name: string;
  tool: DrawnToolType;
  visible: boolean;
  feature: any; // GeoJSON Feature
  properties: Record<string, any>;
  coordinates?: any;
  metrics?: ToolMetrics;
  createdAt: number;
}

export interface ToolsConfiguration {
  marker?: ToolConfig;
  line?: ToolConfig;
  polygon?: ToolConfig;
  circle?: ToolConfig;
  rectangle?: ToolConfig;
  freedraw?: ToolConfig;
  ruler?: ToolConfig;
  capture?: ToolConfig;
  goto?: ToolConfig;
  overlay?: ToolConfig;
  erase?: ToolConfig;
  layerManager?: ToolConfig;
  intersection?: ToolConfig;
  [key: string]: ToolConfig | undefined;
}
