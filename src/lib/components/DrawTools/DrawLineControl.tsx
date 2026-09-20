import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
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

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [lineData, setLineData] = useState<LineItem>(initialLineState);
  const [hasEnoughPoints, setHasEnoughPoints] = useState(false);

  const currentLineCoordsRef = useRef<number[][]>([]);
  const linesRef = useRef<LineItem[]>([]);
  const isDrawingLineRef = useRef(isDrawingLine);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

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
  }, [map, isToolVisible]);

  const updateDraftLineSource = useCallback(
    (liveCoords?: number[][]) => {
      if (!map) return;
      initMapLayers();

      const source = map.getSource("draft-line-source") as any;
      if (!source) return;

      const coordsToDraw = liveCoords || currentLineCoordsRef.current;

      if (coordsToDraw.length > 1) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: coordsToDraw },
            },
          ],
        });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
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
      features: linesRef.current.map((line) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: line.coordinates },
        properties: {
          id: line.id,
          name: line.name,
          color: line.lineColor,
          width: line.lineWidth,
          opacity: line.opacity / 100,
        },
      })),
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
        linesRef.current.push(newLine);
        updateCompletedLinesSource();
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
      }

      currentLineCoordsRef.current = [];
      updateDraftLineSource();
      setIsDrawingLine(false);
      setHasEnoughPoints(false);
    } else {
      currentLineCoordsRef.current = [];
      updateDraftLineSource();
      setIsDrawingLine(false);
      setHasEnoughPoints(false);
    }
  }, [
    setIsDrawingLine,
    updateDraftLineSource,
    updateCompletedLinesSource,
    afterDrawMode,
    onDrawEnd,
  ]);

  useEffect(() => {
    isDrawingLineRef.current = isDrawingLine;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isDrawingLine ? "crosshair" : "";
    }

    if (!isDrawingLine) {
      currentLineCoordsRef.current = [];
      updateDraftLineSource();
      setHasEnoughPoints(false);
    }
  }, [isDrawingLine, map, updateDraftLineSource]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateCompletedLinesSource();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (!isDrawingLineRef.current && map.getLayer("custom-lines-layer")) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["custom-lines-layer"],
        });
        if (features.length > 0) {
          e.preventDefault();
          const clickedId = features[0].properties?.id;
          const line = linesRef.current.find((l) => l.id === clickedId);
          if (line) {
            setLineData(line);
            setOpen(true);
          }
          return;
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
  ]);

  const handleSave = () => {
    const existingIndex = linesRef.current.findIndex(
      (l) => l.id === lineData.id
    );
    if (existingIndex >= 0) {
      linesRef.current[existingIndex] = lineData;
    } else {
      linesRef.current.push(lineData);
    }

    updateCompletedLinesSource();

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
    linesRef.current = linesRef.current.filter((l) => l.id !== lineData.id);
    updateCompletedLinesSource();
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
        onClose={() => setOpen(false)}
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
              onClick={() => setOpen(false)}
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
            onChange={(e) =>
              setLineData((prev) => ({ ...prev, name: e.target.value }))
            }
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
              onChange={(e) =>
                setLineData((prev) => ({ ...prev, lineColor: e.target.value }))
              }
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
                setLineData((prev) => ({
                  ...prev,
                  lineWidth: Number(e.target.value),
                }))
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
