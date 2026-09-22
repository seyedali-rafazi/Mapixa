import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { useDrawLayers } from "../../context/DrawLayersContext";
import { calculateLineDistanceKm } from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Modal } from "../ui/Modal";
import { LineIcon, CheckIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface LineItem {
  id: string;
  name: string;
  lineColor: string;
  lineWidth: number;
  opacity: number;
  coordinates: number[][];
  distanceKm?: number;
}

const initialLineState: LineItem = {
  id: "",
  name: "",
  lineColor: "#007aff",
  lineWidth: 4,
  opacity: 100,
  coordinates: [],
};

export interface DrawLineControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const DrawLineControl: FC<DrawLineControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isDrawingLine, setIsDrawingLine] = useExclusiveTool("line");
  const { onDrawEnd, onDrawDelete, afterDrawMode, extraActions: contextExtraActions } =
    useMapTool();
  const { isToolVisible } = useLayerVisibility();
  const { addDrawnLayer, removeDrawnLayer, drawnLayers, isEraserMode } = useDrawLayers();
  const isEraserModeRef = useRef(isEraserMode);
  isEraserModeRef.current = isEraserMode;

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [lineData, setLineData] = useState<LineItem>(initialLineState);
  const [hasEnoughPoints, setHasEnoughPoints] = useState(false);

  const currentLineCoordsRef = useRef<number[][]>([]);
  const linesRef = useRef<LineItem[]>([]);
  const isDrawingLineRef = useRef(isDrawingLine);

  useEffect(() => {
    const currentLines = drawnLayers
      .filter((l) => l.tool === "line")
      .map(
        (l) =>
          ({
            id: l.id,
            name: l.name,
            coordinates: l.coordinates || l.properties?.coordinates || [],
            lineColor: l.properties?.color || l.properties?.lineColor || "#007aff",
            lineWidth: l.properties?.width || l.properties?.lineWidth || 3,
            opacity: (l.properties?.opacity ?? 1) * 100,
            distanceKm: l.metrics?.distanceKm,
          }) as LineItem
      );
    linesRef.current = currentLines;
  }, [drawnLayers]);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const isMapReady = useCallback(() => {
    if (!map) return false;
    try {
      return Boolean(map.getStyle() && map.getStyle().layers);
    } catch {
      return false;
    }
  }, [map]);

  const initMapLayers = useCallback(() => {
    if (!isMapReady()) return;

    const completedFeatures = linesRef.current.map((line) => ({
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: line.coordinates },
      properties: {
        id: line.id,
        name: line.name,
        color: line.lineColor,
        width: line.lineWidth,
        opacity: line.opacity / 100,
      },
    }));

    if (!map.getSource("custom-lines-source")) {
      map.addSource("custom-lines-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: completedFeatures as any },
      });
    }

    if (!map.getLayer("custom-lines-layer")) {
      map.addLayer({
        id: "custom-lines-layer",
        type: "line",
        source: "custom-lines-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: isToolVisible("line") ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
          "line-opacity": ["get", "opacity"],
        },
      });
    }

    if (!map.getSource("draft-line-source")) {
      map.addSource("draft-line-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("draft-line-layer")) {
      map.addLayer({
        id: "draft-line-layer",
        type: "line",
        source: "draft-line-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff9500",
          "line-width": 4,
          "line-opacity": 0.9,
          "line-dasharray": [3, 2],
        },
      });
    }
  }, [map, isToolVisible, isMapReady]);

  const updateDraftLineSource = useCallback(
    (liveCoords?: number[][], customColor?: string, customWidth?: number) => {
      if (!map) return;
      initMapLayers();

      const source = map.getSource("draft-line-source") as any;
      if (!source) return;

      const coordsToDraw = liveCoords || currentLineCoordsRef.current;

      if (coordsToDraw && coordsToDraw.length > 1) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: coordsToDraw },
              properties: {
                color: customColor || "#ff9500",
                width: customWidth || 4,
              },
            },
          ],
        });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }

      try {
        map.triggerRepaint();
      } catch {
        // ignore
      }
    },
    [map, initMapLayers]
  );

  const updateCompletedLinesSource = useCallback(() => {
    if (!map) return;
    initMapLayers();

    const source = map.getSource("custom-lines-source") as any;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: [],
    });
  }, [map, initMapLayers]);

  const handleFinishDrawing = useCallback(() => {
    if (currentLineCoordsRef.current.length >= 2) {
      const coords = [...currentLineCoordsRef.current];
      const dist = calculateLineDistanceKm(coords);
      const newLine: LineItem = {
        ...initialLineState,
        id: `line-${Date.now()}`,
        name: `Line ${linesRef.current.length + 1}`,
        coordinates: coords,
        distanceKm: parseFloat(dist.toFixed(2)),
      };

      if (afterDrawMode === "auto-save") {
        addDrawnLayer({
          id: newLine.id,
          name: newLine.name,
          tool: "line",
          visible: true,
          coordinates: newLine.coordinates,
          metrics: { distanceKm: newLine.distanceKm },
          properties: {
            id: newLine.id,
            name: newLine.name,
            color: newLine.lineColor,
            width: newLine.lineWidth,
            opacity: newLine.opacity / 100,
          },
          feature: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: newLine.coordinates },
            properties: { id: newLine.id, name: newLine.name },
          },
          createdAt: Date.now(),
        });
        updateCompletedLinesSource();
        updateDraftLineSource([]);
        onDrawEnd?.({
          id: newLine.id,
          tool: "line",
          feature: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: newLine.coordinates },
            properties: { id: newLine.id, name: newLine.name },
          },
          coordinates: newLine.coordinates,
          properties: { ...newLine },
          metrics: { distanceKm: newLine.distanceKm },
        });
        toast.success(`Line drawn (${newLine.distanceKm} km)`);
      } else {
        setLineData(newLine);
        setOpen(true);
        // Keep draft line visible on map while modal is open
        updateDraftLineSource(newLine.coordinates, newLine.lineColor, newLine.lineWidth);
      }

      currentLineCoordsRef.current = [];
      setIsDrawingLine(false);
      setHasEnoughPoints(false);
    } else {
      currentLineCoordsRef.current = [];
      updateDraftLineSource([]);
      setIsDrawingLine(false);
      setHasEnoughPoints(false);
    }
  }, [
    setIsDrawingLine,
    updateDraftLineSource,
    updateCompletedLinesSource,
    afterDrawMode,
    onDrawEnd,
    addDrawnLayer,
  ]);

  useEffect(() => {
    isDrawingLineRef.current = isDrawingLine;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isDrawingLine ? "crosshair" : "";
    }

    if (!isDrawingLine) {
      currentLineCoordsRef.current = [];
      setHasEnoughPoints(false);
      if (!open) {
        updateDraftLineSource([]);
      }
    }
  }, [isDrawingLine, map, updateDraftLineSource, open]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateCompletedLinesSource();
      updateDraftLineSource([]);
    };

    if (isMapReady()) initMapLayers();
    map.on("style.load", onStyleLoad);
    map.on("load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (isEraserModeRef.current) return;

      const layersToCheck = [
        map.getLayer("custom-draw-lines-layer") ? "custom-draw-lines-layer" : null,
        map.getLayer("custom-lines-layer") ? "custom-lines-layer" : null,
      ].filter(Boolean) as string[];

      if (!isDrawingLineRef.current && layersToCheck.length > 0) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: layersToCheck,
        });
        if (features.length > 0) {
          const clickedId = features[0].properties?.id;
          const line = linesRef.current.find((l) => l.id === clickedId);
          if (line) {
            e.preventDefault();
            setLineData(line);
            setOpen(true);
            return;
          }
        }
      }

      if (isDrawingLineRef.current) {
        const newCoord = [
          parseFloat(e.lngLat.lng.toFixed(5)),
          parseFloat(e.lngLat.lat.toFixed(5)),
        ];
        currentLineCoordsRef.current.push(newCoord);
        if (currentLineCoordsRef.current.length >= 2) {
          setHasEnoughPoints(true);
        }
        updateDraftLineSource();
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawingLineRef.current || currentLineCoordsRef.current.length === 0)
        return;
      const hoverCoord = [e.lngLat.lng, e.lngLat.lat];
      updateDraftLineSource([...currentLineCoordsRef.current, hoverCoord]);
    };

    const handleDblClick = (e: any) => {
      if (isDrawingLineRef.current) {
        e.preventDefault();
        handleFinishDrawing();
      }
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("load", onStyleLoad);
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
      map.off("dblclick", handleDblClick);
    };
  }, [
    map,
    initMapLayers,
    updateCompletedLinesSource,
    updateDraftLineSource,
    handleFinishDrawing,
    isMapReady,
  ]);

  const handleCloseModal = () => {
    setOpen(false);
    updateDraftLineSource([]);
  };

  const handlePropertyChange = (updates: Partial<LineItem>) => {
    setLineData((prev) => {
      const next = { ...prev, ...updates };
      if (!drawnLayers.some((l) => l.id === next.id)) {
        updateDraftLineSource(next.coordinates, next.lineColor, next.lineWidth);
      }
      return next;
    });
  };

  const handleSave = () => {
    addDrawnLayer({
      id: lineData.id,
      name: lineData.name,
      tool: "line",
      visible: true,
      coordinates: lineData.coordinates,
      metrics: { distanceKm: lineData.distanceKm },
      properties: {
        id: lineData.id,
        name: lineData.name,
        color: lineData.lineColor,
        width: lineData.lineWidth,
        opacity: lineData.opacity / 100,
      },
      feature: {
        type: "Feature",
        geometry: { type: "LineString", coordinates: lineData.coordinates },
        properties: { id: lineData.id, name: lineData.name },
      },
      createdAt: Date.now(),
    });

    updateCompletedLinesSource();
    updateDraftLineSource([]);

    onDrawEnd?.({
      id: lineData.id,
      tool: "line",
      feature: {
        type: "Feature",
        geometry: { type: "LineString", coordinates: lineData.coordinates },
        properties: { id: lineData.id, name: lineData.name },
      },
      coordinates: lineData.coordinates,
      properties: { ...lineData },
      metrics: { distanceKm: lineData.distanceKm },
    });

    setOpen(false);
    toast.success("Line saved");
  };

  const handleDelete = () => {
    removeDrawnLayer(lineData.id);
    updateCompletedLinesSource();
    updateDraftLineSource([]);
    onDrawDelete?.({ id: lineData.id, tool: "line" });
    setOpen(false);
    toast.info("Line deleted");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isDrawingLine ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsDrawingLine(!isDrawingLine)}
        title={
          isDrawingLine
            ? "Click points to draw line. Double click or click checkmark to finish"
            : "Draw Custom Polyline"
        }
      >
        <LineIcon size={18} />
      </button>

      {/* Floating Finish Button when user has >= 2 points */}
      {isDrawingLine && hasEnoughPoints && (
        <button
          type="button"
          className="mlt-icon-btn"
          onClick={handleFinishDrawing}
          title="Finish Drawing Line"
          style={{
            width: 32,
            height: 32,
            backgroundColor: "#10b981",
            color: "#ffffff",
            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.4)",
          }}
        >
          <CheckIcon size={16} />
        </button>
      )}

      <Modal
        open={open}
        onClose={handleCloseModal}
        title={lineData.id ? "Edit Line" : "New Line"}
        footer={
          <div className="mlt-modal-footer">
            {linesRef.current.some((l) => l.id === lineData.id) && (
              <button
                type="button"
                className="mlt-btn mlt-btn-danger"
                onClick={handleDelete}
                style={{ marginRight: "auto" }}
              >
                <TrashIcon size={14} /> Delete
              </button>
            )}
            <button
              type="button"
              className="mlt-btn mlt-btn-secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mlt-btn mlt-btn-primary"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="mlt-form-group">
          <label className="mlt-label">Name / Label</label>
          <input
            type="text"
            className="mlt-input"
            value={lineData.name}
            onChange={(e) => handlePropertyChange({ name: e.target.value })}
            placeholder="e.g. Hiking Trail"
          />
        </div>

        {lineData.distanceKm !== undefined && (
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb" }}>
            Total Length: {lineData.distanceKm} km
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
          <div className="mlt-form-group">
            <label className="mlt-label">Line Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={lineData.lineColor}
              onChange={(e) => handlePropertyChange({ lineColor: e.target.value })}
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">
              Width ({lineData.lineWidth}px)
            </label>
            <input
              type="range"
              className="mlt-slider"
              min={1}
              max={16}
              value={lineData.lineWidth}
              onChange={(e) =>
                handlePropertyChange({
                  lineWidth: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* Post-draw Extra Actions */}
        <div style={{ marginTop: "8px", borderTop: "1px solid var(--mlt-border)", paddingTop: "12px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mlt-text-muted)", marginBottom: "8px" }}>
            Quick Actions:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
            <button
              type="button"
              className="mlt-btn mlt-btn-outline"
              onClick={() => {
                copyToClipboard(
                  JSON.stringify({
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: lineData.coordinates,
                    },
                    properties: {
                      name: lineData.name,
                      distanceKm: lineData.distanceKm,
                    },
                  })
                );
                toast.success("Copied Line GeoJSON");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <CopyIcon size={13} /> Copy GeoJSON
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "line",
              coordinates: lineData.coordinates,
              properties: { ...lineData },
              metrics: { distanceKm: lineData.distanceKm },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default DrawLineControl;
