import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { useDrawLayers } from "../../context/DrawLayersContext";
import { calculateLineDistanceKm } from "../../utils/geoCalculations";
import { Popover } from "../ui/Popover";
import { FreehandIcon, TrashIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface FreeDrawControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const FreeDrawControl: FC<FreeDrawControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isDrawingMode, setIsDrawingMode] = useExclusiveTool("freedraw");
  const { onDrawEnd, extraActions: contextExtraActions } = useMapTool();
  const { isToolVisible } = useLayerVisibility();
  const { addDrawnLayer, removeDrawnLayer, drawnLayers } = useDrawLayers();

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [lineColor, setLineColor] = useState("#ff2d55");
  const [lineWidth, setLineWidth] = useState(4);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);

  const isMouseDownRef = useRef(false);
  const currentCoordsRef = useRef<number[][]>([]);
  const featuresRef = useRef<any[]>([]);

  useEffect(() => {
    const currentFreedraws = drawnLayers
      .filter((l) => l.tool === "freedraw")
      .map((l) => l.feature);
    featuresRef.current = currentFreedraws;
  }, [drawnLayers]);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    if (!map.getSource("custom-freedraw-source")) {
      map.addSource("custom-freedraw-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: featuresRef.current },
      });
    }

    if (!map.getLayer("custom-freedraw-layer")) {
      map.addLayer({
        id: "custom-freedraw-layer",
        type: "line",
        source: "custom-freedraw-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: isToolVisible("freedraw") ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
        },
      });
    }

    if (!map.getSource("draft-freedraw-source")) {
      map.addSource("draft-freedraw-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("draft-freedraw-layer")) {
      map.addLayer({
        id: "draft-freedraw-layer",
        type: "line",
        source: "draft-freedraw-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": lineColor,
          "line-width": lineWidth,
        },
      });
    }
  }, [map, isToolVisible, lineColor, lineWidth]);

  const updateDraft = (coords: number[][]) => {
    if (!map) return;
    const source = map.getSource("draft-freedraw-source") as any;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features:
        coords.length > 1
          ? [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: coords },
                properties: {},
              },
            ]
          : [],
    });
  };

  const syncFeatures = () => {
    if (!map) return;
    const source = map.getSource("custom-freedraw-source") as any;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [...featuresRef.current],
      });
    }
  };

  useEffect(() => {
    if (!map) return;

    if (isDrawingMode) {
      map.dragPan.disable();
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
      updateDraft([]);
      setSettingsAnchor(null);
    }
  }, [isDrawingMode, map]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      syncFeatures();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const onMouseDown = (e: any) => {
      if (!isDrawingMode) return;
      isMouseDownRef.current = true;
      currentCoordsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      updateDraft(currentCoordsRef.current);
    };

    const onMouseMove = (e: any) => {
      if (!isDrawingMode || !isMouseDownRef.current) return;
      currentCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateDraft(currentCoordsRef.current);
    };

    const onMouseUp = () => {
      if (!isDrawingMode || !isMouseDownRef.current) return;
      isMouseDownRef.current = false;

      if (currentCoordsRef.current.length > 1) {
        const coords = [...currentCoordsRef.current];
        const dist = calculateLineDistanceKm(coords);
        const newFeature = {
          type: "Feature",
          properties: {
            id: `freedraw-${Date.now()}`,
            color: lineColor,
            width: lineWidth,
            distanceKm: parseFloat(dist.toFixed(2)),
          },
          geometry: {
            type: "LineString",
            coordinates: coords,
          },
        };

        addDrawnLayer({
          id: newFeature.properties.id,
          name: `Freehand ${drawnLayers.filter((l) => l.tool === "freedraw").length + 1}`,
          tool: "freedraw",
          visible: true,
          coordinates: coords,
          metrics: { distanceKm: newFeature.properties.distanceKm },
          properties: {
            id: newFeature.properties.id,
            color: lineColor,
            width: lineWidth,
            opacity: 1,
          },
          feature: newFeature as any,
          createdAt: Date.now(),
        });

        updateDraft([]);

        onDrawEnd?.({
          id: newFeature.properties.id,
          tool: "freedraw",
          feature: newFeature as any,
          coordinates: coords,
          properties: { ...newFeature.properties },
          metrics: { distanceKm: newFeature.properties.distanceKm },
        });

        toast.success(`Freehand stroke added (${newFeature.properties.distanceKm} km)`);
      }
      currentCoordsRef.current = [];
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
    };
  }, [map, isDrawingMode, lineColor, lineWidth, initMapLayers, onDrawEnd, addDrawnLayer, drawnLayers]);

  const clearAllFreeDraw = () => {
    drawnLayers
      .filter((l) => l.tool === "freedraw")
      .forEach((l) => removeDrawnLayer(l.id));
    toast.info("Cleared freehand drawings");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isDrawingMode ? "mlt-icon-btn-active" : ""}`}
        onClick={(e) => {
          if (!isDrawingMode) {
            setIsDrawingMode(true);
            setSettingsAnchor(e.currentTarget);
          } else {
            setIsDrawingMode(false);
            setSettingsAnchor(null);
          }
        }}
        title={
          isDrawingMode
            ? "Freehand Pen active (click to turn off)"
            : "Freehand Pen Draw"
        }
      >
        <FreehandIcon size={18} />
      </button>

      {/* Brush Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        width={240}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Brush Settings</span>
            <div
              style={{
                width: Math.min(24, Math.max(10, lineWidth * 1.5)),
                height: Math.min(24, Math.max(10, lineWidth * 1.5)),
                borderRadius: "50%",
                backgroundColor: lineColor,
                border: "2px solid rgba(0,0,0,0.15)",
                boxShadow: `0 0 8px ${lineColor}66`,
              }}
              title="Stroke Preview"
            />
          </div>

          {/* Quick Color Presets */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {["#ff2d55", "#007aff", "#34c759", "#ff9500", "#af52de", "#1c1c1e"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setLineColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: c,
                  border: lineColor === c ? "2px solid #ffffff" : "1px solid rgba(0,0,0,0.15)",
                  boxShadow: lineColor === c ? "0 0 0 2px var(--mlt-primary, #007aff)" : "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">Custom Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
            />
          </div>

          <div className="mlt-form-group">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label className="mlt-label">Stroke Width</label>
              <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{lineWidth}px</span>
            </div>
            <input
              type="range"
              className="mlt-slider"
              min={1}
              max={20}
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="button"
              className="mlt-btn mlt-btn-danger"
              onClick={clearAllFreeDraw}
              style={{ fontSize: "0.75rem", padding: "5px 8px", flex: 1 }}
            >
              <TrashIcon size={13} /> Clear
            </button>
            <button
              type="button"
              className="mlt-btn mlt-btn-primary"
              onClick={() => setSettingsAnchor(null)}
              style={{ fontSize: "0.75rem", padding: "5px 12px" }}
            >
              Done
            </button>
          </div>

          {/* Extra Actions */}
          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "freedraw",
              feature: featuresRef.current,
              map,
              closeModal: () => setSettingsAnchor(null),
            }}
          />
        </div>
      </Popover>
    </>
  );
};

export default FreeDrawControl;
