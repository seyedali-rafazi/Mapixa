import type { ToolType, ToolMetrics } from "./tools";

export interface DrawEndEvent {
  id: string;
  tool: ToolType;
  feature: {
    type: "Feature";
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: Record<string, any>;
  };
  coordinates: any;
  properties: Record<string, any>;
  metrics?: ToolMetrics;
  raw?: any;
}

export interface DrawChangeEvent {
  tool: ToolType;
  action: "create" | "update" | "delete";
  feature: any;
  allFeatures: any[];
}

export interface DrawDeleteEvent {
  id: string;
  tool: ToolType;
}

export interface LayerVisibilityChangeEvent {
  tool: ToolType;
  visible: boolean;
  visibilityState: Record<string, boolean>;
}
