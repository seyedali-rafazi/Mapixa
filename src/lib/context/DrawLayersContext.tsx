import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useMap } from "react-map-gl/maplibre";
import type { DrawnLayerItem, DrawnToolType } from "../types/tools";
import { useLayerVisibility } from "./LayerVisibilityContext";
import { toast } from "sonner";

export interface DrawLayersContextValue {
  drawnLayers: DrawnLayerItem[];
  isEraserMode: boolean;
  setIsEraserMode: (active: boolean) => void;
  toggleEraserMode: () => void;
  addDrawnLayer: (layer: DrawnLayerItem) => void;
  updateDrawnLayer: (id: string, updates: Partial<DrawnLayerItem>) => void;
  removeDrawnLayer: (id: string) => void;
  clearAllDrawnLayers: () => void;
  reorderDrawnLayers: (fromIndex: number, toIndex: number) => void;
  toggleLayerVisibility: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setAllDrawnLayersVisibility: (visible: boolean) => void;
  zoomToLayer: (id: string) => void;
  activeSelectedLayerId: string | null;
  setActiveSelectedLayerId: (id: string | null) => void;
}

const DrawLayersContext = createContext<DrawLayersContextValue | null>(null);

export interface DrawLayersProviderProps {
  children: ReactNode;
  initialLayers?: DrawnLayerItem[];
  onLayersChange?: (layers: DrawnLayerItem[]) => void;
}

export const DrawLayersProvider: FC<DrawLayersProviderProps> = ({
  children,
  initialLayers = [],
  onLayersChange,
}) => {
  const [drawnLayers, setDrawnLayers] = useState<DrawnLayerItem[]>(initialLayers);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [activeSelectedLayerId, setActiveSelectedLayerId] = useState<string | null>(null);

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();
  const { isToolVisible, visibility } = useLayerVisibility();

  const drawnLayersRef = useRef(drawnLayers);
  drawnLayersRef.current = drawnLayers;

  const isEraserModeRef = useRef(isEraserMode);
  isEraserModeRef.current = isEraserMode;

  // Check if map style is loaded and ready for sources/layers
  const isMapStyleReady = useCallback(() => {
    if (!map) return false;
    try {
      return Boolean(map.getStyle() && map.getStyle().layers);
    } catch {
      return false;
    }
  }, [map]);

  // Initialize unified map sources & layers
  const initUnifiedLayers = useCallback(() => {
    if (!isMapStyleReady()) return;

    // 1. Shapes Source (Polygons, Circles, Rectangles)
    if (!map.getSource("custom-draw-shapes-source")) {
      map.addSource("custom-draw-shapes-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("custom-draw-shapes-fill")) {
      map.addLayer({
        id: "custom-draw-shapes-fill",
        type: "fill",
        source: "custom-draw-shapes-source",
        layout: { visibility: "visible" },
        paint: {
          "fill-color": ["coalesce", ["get", "fillColor"], "#007aff"],
          "fill-opacity": ["coalesce", ["get", "fillOpacity"], 0.3],
        },
      });
    }

    if (!map.getLayer("custom-draw-shapes-outline")) {
      map.addLayer({
        id: "custom-draw-shapes-outline",
        type: "line",
        source: "custom-draw-shapes-source",
        layout: {
          visibility: "visible",
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ["coalesce", ["get", "outlineColor"], "#0051a8"],
          "line-width": ["coalesce", ["get", "lineWidth"], 2.5],
        },
      });
    }

    // 2. Lines Source (Lines, FreeDraws)
    if (!map.getSource("custom-draw-lines-source")) {
      map.addSource("custom-draw-lines-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("custom-draw-lines-layer")) {
      map.addLayer({
        id: "custom-draw-lines-layer",
        type: "line",
        source: "custom-draw-lines-source",
        layout: {
          visibility: "visible",
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#007aff"],
          "line-width": ["coalesce", ["get", "width"], 3],
          "line-opacity": ["coalesce", ["get", "opacity"], 1],
        },
      });
    }

    // Ensure outlines are on top of fills, and lines are on top of outlines
    try {
      if (
        map.getLayer("custom-draw-shapes-fill") &&
        map.getLayer("custom-draw-shapes-outline")
      ) {
        map.moveLayer("custom-draw-shapes-outline");
      }
      if (map.getLayer("custom-draw-lines-layer")) {
        map.moveLayer("custom-draw-lines-layer");
      }
    } catch {
      // ignore
    }
  }, [map, isMapStyleReady]);

  // Synchronize GeoJSON features with MapLibre layers based on drawnLayers & visibility
  const syncMapFeatures = useCallback(
    (layersToSync?: DrawnLayerItem[]) => {
      if (!isMapStyleReady()) return;
      initUnifiedLayers();

      const shapeFeatures: any[] = [];
      const lineFeatures: any[] = [];
      const activeLayers = layersToSync ?? drawnLayersRef.current;

      activeLayers.forEach((item) => {
        // Check tool category visibility AND individual layer visibility
        const categoryVisible = isToolVisible(item.tool as any);
        if (!categoryVisible || item.visible === false) return;

        const fillColor = item.properties?.fillColor || "#007aff";
        const fillOpacity =
          typeof item.properties?.fillOpacity === "number" && !isNaN(item.properties.fillOpacity)
            ? item.properties.fillOpacity
            : 0.3;
        const outlineColor =
          item.properties?.outlineColor || item.properties?.lineColor || "#0051a8";
        const lineWidth =
          typeof item.properties?.lineWidth === "number" && !isNaN(item.properties.lineWidth)
            ? item.properties.lineWidth
            : 2.5;

        const lineColor = item.properties?.color || item.properties?.lineColor || "#007aff";
        const lineWidthVal =
          typeof item.properties?.width === "number" && !isNaN(item.properties.width)
            ? item.properties.width
            : lineWidth;
        const lineOpacity =
          typeof item.properties?.opacity === "number" && !isNaN(item.properties.opacity)
            ? item.properties.opacity
            : 1;

        const feature = {
          ...item.feature,
          properties: {
            ...(item.feature?.properties || {}),
            ...item.properties,
            id: item.id,
            name: item.name,
            tool: item.tool,
            fillColor,
            fillOpacity,
            outlineColor,
            lineWidth,
            color: lineColor,
            width: lineWidthVal,
            opacity: lineOpacity,
          },
        };

        if (
          item.tool === "rectangle" ||
          item.tool === "circle" ||
          item.tool === "polygon"
        ) {
          shapeFeatures.push(feature);
        } else if (
          item.tool === "line" ||
          item.tool === "freedraw" ||
          item.tool === "intersection"
        ) {
          lineFeatures.push(feature);
        }
      });

      const shapesSource = map.getSource("custom-draw-shapes-source") as any;
      if (shapesSource && typeof shapesSource.setData === "function") {
        shapesSource.setData({
          type: "FeatureCollection",
          features: shapeFeatures,
        });
      }

      const linesSource = map.getSource("custom-draw-lines-source") as any;
      if (linesSource && typeof linesSource.setData === "function") {
        linesSource.setData({
          type: "FeatureCollection",
          features: lineFeatures,
        });
      }

      try {
        map.triggerRepaint();
      } catch {
        // ignore
      }
    },
    [map, initUnifiedLayers, isToolVisible, isMapStyleReady, visibility]
  );

  // Handle map style loads and data updates
  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      initUnifiedLayers();
      syncMapFeatures();
    };

    if (isMapStyleReady()) {
      initUnifiedLayers();
      syncMapFeatures();
    }

    map.on("load", handleStyleData);
    map.on("style.load", handleStyleData);
    map.on("styledata", handleStyleData);
    return () => {
      map.off("load", handleStyleData);
      map.off("style.load", handleStyleData);
      map.off("styledata", handleStyleData);
    };
  }, [map, isMapStyleReady, initUnifiedLayers, syncMapFeatures]);

  // Sync features when drawnLayers or visibility changes
  useEffect(() => {
    syncMapFeatures();
  }, [drawnLayers, visibility, syncMapFeatures]);

  // Notify consumer of layer changes
  useEffect(() => {
    onLayersChange?.(drawnLayers);
  }, [drawnLayers, onLayersChange]);

  // Handle interactive eraser mode map interactions
  useEffect(() => {
    if (!map) return;

    const canvas = map.getCanvas();
    if (canvas) {
      if (isEraserMode) {
        canvas.style.cursor = "not-allowed";
      } else {
        canvas.style.cursor = "";
      }
    }

    const handleEraserClick = (e: any) => {
      if (!isEraserModeRef.current) return;

      const interactiveLayers = [
        "custom-draw-shapes-fill",
        "custom-draw-shapes-outline",
        "custom-draw-lines-layer",
        "custom-markers-layer",
        "custom-lines-layer",
        "custom-freedraw-layer",
        "intersection-lines-layer",
        "intersection-points-layer",
      ].filter((layerId) => map.getLayer(layerId));

      if (interactiveLayers.length === 0) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: interactiveLayers,
      });

      if (features && features.length > 0) {
        e.preventDefault();
        const clickedId = features[0].properties?.id;
        if (clickedId) {
          const itemToDelete = drawnLayersRef.current.find((l) => l.id === clickedId);
          removeDrawnLayer(clickedId);
          toast.success(`Erased ${itemToDelete?.name || "drawn layer"}`);
        }
      }
    };

    map.on("click", handleEraserClick);
    return () => {
      map.off("click", handleEraserClick);
      if (canvas && isEraserModeRef.current) {
        canvas.style.cursor = "";
      }
    };
  }, [map, isEraserMode]);

  const addDrawnLayer = useCallback(
    (layer: DrawnLayerItem) => {
      setDrawnLayers((prev) => {
        const existingIdx = prev.findIndex((l) => l.id === layer.id);
        const next =
          existingIdx >= 0
            ? prev.map((l, i) => (i === existingIdx ? layer : l))
            : [...prev, layer];
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const updateDrawnLayer = useCallback(
    (id: string, updates: Partial<DrawnLayerItem>) => {
      setDrawnLayers((prev) => {
        const next = prev.map((layer) =>
          layer.id === id ? { ...layer, ...updates } : layer
        );
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const removeDrawnLayer = useCallback(
    (id: string) => {
      setDrawnLayers((prev) => {
        const next = prev.filter((layer) => layer.id !== id);
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const clearAllDrawnLayers = useCallback(() => {
    drawnLayersRef.current = [];
    setDrawnLayers([]);
    syncMapFeatures([]);
    toast.info("All drawn layers cleared");
  }, [syncMapFeatures]);

  const reorderDrawnLayers = useCallback(
    (fromIndex: number, toIndex: number) => {
      setDrawnLayers((prev) => {
        if (
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length
        ) {
          return prev;
        }
        const next = [...prev];
        const [movedItem] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, movedItem);
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const toggleLayerVisibility = useCallback(
    (id: string) => {
      setDrawnLayers((prev) => {
        const next = prev.map((layer) =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer
        );
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const setLayerVisibility = useCallback(
    (id: string, visible: boolean) => {
      setDrawnLayers((prev) => {
        const next = prev.map((layer) =>
          layer.id === id ? { ...layer, visible } : layer
        );
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const setAllDrawnLayersVisibility = useCallback(
    (visible: boolean) => {
      setDrawnLayers((prev) => {
        const next = prev.map((layer) => ({ ...layer, visible }));
        drawnLayersRef.current = next;
        syncMapFeatures(next);
        return next;
      });
    },
    [syncMapFeatures]
  );

  const toggleEraserMode = useCallback(() => {
    setIsEraserMode((prev) => {
      const next = !prev;
      if (next) {
        toast.info("Interactive Eraser Mode active: click any drawn shape to erase it");
      } else {
        toast.info("Eraser Mode deactivated");
      }
      return next;
    });
  }, []);

  const zoomToLayer = useCallback(
    (id: string) => {
      if (!map) return;
      const targetLayer = drawnLayersRef.current.find((l) => l.id === id);
      if (!targetLayer) return;

      try {
        const coords = targetLayer.coordinates;
        const geom = targetLayer.feature?.geometry;

        if (targetLayer.tool === "marker" && coords) {
          map.flyTo({
            center: [coords[0], coords[1]],
            zoom: Math.max(map.getZoom(), 14),
            essential: true,
          });
          return;
        }

        if (targetLayer.tool === "circle" && coords) {
          map.flyTo({
            center: coords,
            zoom: Math.max(map.getZoom(), 13),
            essential: true,
          });
          return;
        }

        // Bounding box calculation for lines, rectangles, polygons
        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;

        const processCoord = (pt: [number, number]) => {
          if (!Array.isArray(pt) || pt.length < 2) return;
          const [lng, lat] = pt;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        };

        if (geom?.type === "Polygon" && Array.isArray(geom.coordinates?.[0])) {
          geom.coordinates[0].forEach(processCoord);
        } else if (geom?.type === "LineString" && Array.isArray(geom.coordinates)) {
          geom.coordinates.forEach(processCoord);
        } else if (Array.isArray(coords)) {
          coords.forEach(processCoord);
        }

        if (
          isFinite(minLng) &&
          isFinite(maxLng) &&
          isFinite(minLat) &&
          isFinite(maxLat)
        ) {
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: 80, maxZoom: 16, duration: 1000 }
          );
        }
      } catch (err) {
        console.error("Failed to zoom to layer:", err);
      }
    },
    [map]
  );

  const value = useMemo(
    () => ({
      drawnLayers,
      isEraserMode,
      setIsEraserMode,
      toggleEraserMode,
      addDrawnLayer,
      updateDrawnLayer,
      removeDrawnLayer,
      clearAllDrawnLayers,
      reorderDrawnLayers,
      toggleLayerVisibility,
      setLayerVisibility,
      setAllDrawnLayersVisibility,
      zoomToLayer,
      activeSelectedLayerId,
      setActiveSelectedLayerId,
    }),
    [
      drawnLayers,
      isEraserMode,
      toggleEraserMode,
      addDrawnLayer,
      updateDrawnLayer,
      removeDrawnLayer,
      clearAllDrawnLayers,
      reorderDrawnLayers,
      toggleLayerVisibility,
      setLayerVisibility,
      setAllDrawnLayersVisibility,
      zoomToLayer,
      activeSelectedLayerId,
    ]
  );

  return (
    <DrawLayersContext.Provider value={value}>
      {children}
    </DrawLayersContext.Provider>
  );
};

export const useDrawLayers = (): DrawLayersContextValue => {
  const context = useContext(DrawLayersContext);
  if (!context) {
    throw new Error("useDrawLayers must be used within a DrawLayersProvider");
  }
  return context;
};

export default DrawLayersContext;
