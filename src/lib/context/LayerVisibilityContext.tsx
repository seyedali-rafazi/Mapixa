import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMap } from "react-map-gl/maplibre";
import type { ToolType, LayerVisibilityState } from "../types/tools";

export interface LayerVisibilityContextValue {
  visibility: LayerVisibilityState;
  isToolVisible: (tool: ToolType) => boolean;
  setToolVisibility: (tool: ToolType, visible: boolean) => void;
  toggleToolVisibility: (tool: ToolType) => void;
  setAllVisibility: (visible: boolean) => void;
}

const defaultVisibility: LayerVisibilityState = {
  marker: true,
  line: true,
  polygon: true,
  circle: true,
  rectangle: true,
  freedraw: true,
  ruler: true,
  overlay: true,
};

// Normalize common typos and aliases (e.g. polyline/polyine -> line)
export function normalizeVisibility(
  input?: Partial<LayerVisibilityState>
): Partial<LayerVisibilityState> {
  if (!input) return {};
  const normalized: any = { ...input };
  if ("polyine" in input) normalized.line = (input as any).polyine;
  if ("polyline" in input) normalized.line = (input as any).polyline;
  if ("lines" in input) normalized.line = (input as any).lines;
  if ("markers" in input) normalized.marker = (input as any).markers;
  if ("polygons" in input) normalized.polygon = (input as any).polygons;
  if ("circles" in input) normalized.circle = (input as any).circles;
  if ("rectangles" in input) normalized.rectangle = (input as any).rectangles;
  if ("freedraws" in input) normalized.freedraw = (input as any).freedraws;
  if ("rulers" in input) normalized.ruler = (input as any).rulers;
  if ("overlays" in input) normalized.overlay = (input as any).overlays;
  return normalized;
}

// Map each tool to its MapLibre GL layer IDs
export const TOOL_LAYER_MAP: Record<ToolType, string[]> = {
  marker: ["custom-markers-layer"],
  line: ["custom-lines-layer", "draft-line-layer"],
  polygon: [
    "custom-poly-fill",
    "custom-poly-outline",
    "custom-poly-handles-layer",
  ],
  circle: [
    "custom-circle-fill",
    "custom-circle-outline",
    "custom-circle-handles-layer",
  ],
  rectangle: [
    "custom-rect-fill",
    "custom-rect-outline",
    "custom-rect-handles-layer",
  ],
  freedraw: ["custom-freedraw-layer", "draft-freedraw-layer"],
  ruler: ["ruler-line-layer", "ruler-label-layer", "ruler-points-layer"],
  capture: [],
  goto: [],
  overlay: [],
};

const LayerVisibilityContext = createContext<LayerVisibilityContextValue>({
  visibility: defaultVisibility,
  isToolVisible: () => true,
  setToolVisibility: () => {},
  toggleToolVisibility: () => {},
  setAllVisibility: () => {},
});

export interface LayerVisibilityProviderProps {
  children: ReactNode;
  visibility?: Partial<LayerVisibilityState>;
  initialVisibility?: Partial<LayerVisibilityState>;
  onVisibilityChange?: (
    tool: ToolType,
    visible: boolean,
    allState: LayerVisibilityState
  ) => void;
}

export function LayerVisibilityProvider({
  children,
  visibility: controlledVisibility,
  initialVisibility,
  onVisibilityChange,
}: LayerVisibilityProviderProps) {
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [visibility, setVisibility] = useState<LayerVisibilityState>(() => ({
    ...defaultVisibility,
    ...normalizeVisibility(initialVisibility || controlledVisibility),
  }));

  // Synchronize MapLibre layer visibility whenever visibility state or map style loads
  const syncLayerVisibility = useCallback(
    (tool: ToolType, isVisible: boolean) => {
      if (!map) return;
      const layers = TOOL_LAYER_MAP[tool] || [];
      const visibilityValue = isVisible ? "visible" : "none";

      layers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", visibilityValue);
        }
      });
    },
    [map]
  );

  // Sync controlled visibility changes from props
  useEffect(() => {
    if (controlledVisibility) {
      const normalized = normalizeVisibility(controlledVisibility);
      setVisibility((prev) => {
        const next = { ...prev, ...normalized };
        (Object.keys(normalized) as ToolType[]).forEach((tool) => {
          if (tool in TOOL_LAYER_MAP) {
            syncLayerVisibility(tool, next[tool]);
          }
        });
        return next;
      });
    }
  }, [controlledVisibility, syncLayerVisibility]);

  // Apply to all layers whenever style reloads
  useEffect(() => {
    if (!map) return;

    const onStyleData = () => {
      (Object.keys(visibility) as ToolType[]).forEach((tool) => {
        syncLayerVisibility(tool, visibility[tool]);
      });
    };

    map.on("styledata", onStyleData);
    return () => {
      map.off("styledata", onStyleData);
    };
  }, [map, visibility, syncLayerVisibility]);

  const setToolVisibility = useCallback(
    (tool: ToolType, isVisible: boolean) => {
      setVisibility((prev) => {
        const next = { ...prev, [tool]: isVisible };
        syncLayerVisibility(tool, isVisible);
        onVisibilityChange?.(tool, isVisible, next);
        return next;
      });
    },
    [syncLayerVisibility, onVisibilityChange]
  );

  const toggleToolVisibility = useCallback(
    (tool: ToolType) => {
      setVisibility((prev) => {
        const nextVisible = !prev[tool];
        const next = { ...prev, [tool]: nextVisible };
        syncLayerVisibility(tool, nextVisible);
        onVisibilityChange?.(tool, nextVisible, next);
        return next;
      });
    },
    [syncLayerVisibility, onVisibilityChange]
  );

  const setAllVisibility = useCallback(
    (isVisible: boolean) => {
      setVisibility((prev) => {
        const next = { ...prev };
        (Object.keys(next) as ToolType[]).forEach((tool) => {
          next[tool] = isVisible;
          syncLayerVisibility(tool, isVisible);
        });
        return next;
      });
    },
    [syncLayerVisibility]
  );

  const isToolVisible = useCallback(
    (tool: ToolType) => {
      return visibility[tool] ?? true;
    },
    [visibility]
  );

  const value = useMemo(
    () => ({
      visibility,
      isToolVisible,
      setToolVisibility,
      toggleToolVisibility,
      setAllVisibility,
    }),
    [
      visibility,
      isToolVisible,
      setToolVisibility,
      toggleToolVisibility,
      setAllVisibility,
    ]
  );

  return (
    <LayerVisibilityContext.Provider value={value}>
      {children}
    </LayerVisibilityContext.Provider>
  );
}

export function useLayerVisibility() {
  return useContext(LayerVisibilityContext);
}

export default LayerVisibilityProvider;
