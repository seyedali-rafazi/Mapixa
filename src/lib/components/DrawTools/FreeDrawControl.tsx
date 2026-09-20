import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { calculateLineDistanceKm } from "../../utils/geoCalculations";
import { Popover } from "../ui/Popover";
import { FreehandIcon, TuneIcon, TrashIcon } from "../ui/Icons";
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

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [lineColor, setLineColor] = useState("#ff2d55");
  const [lineWidth, setLineWidth] = useState(4);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);

  const isMouseDownRef = useRef(false);
  const currentCoordsRef = useRef<number[][]>([]);
  const featuresRef = useRef<any[]>([]);

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

        featuresRef.current.push(newFeature);
        syncFeatures();
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
  }, [map, isDrawingMode, lineColor, lineWidth, initMapLayers, onDrawEnd]);

  const clearAllFreeDraw = () => {
    featuresRef.current = [];
    syncFeatures();
    toast.info("Cleared freehand drawings");
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <button
          type="button"
          className={`mlt-icon-btn ${isDrawingMode ? "mlt-icon-btn-active" : ""}`}
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          title={
            isDrawingMode
              ? "Click and drag on map to sketch freehand"
              : "Freehand Pen Draw"
          }
        >
          <FreehandIcon size={18} />
        </button>

        {isDrawingMode && (
          <button
            type="button"
            className="mlt-icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
            title="Brush Settings"
          >
            <TuneIcon size={14} />
          </button>
        )}
      </div>

      {/* Brush Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        width={220}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Brush Settings</div>

          <div className="mlt-form-group">
            <label className="mlt-label">Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">
              Stroke Width ({lineWidth}px)
            </label>
            <input
              type="range"
              className="mlt-slider"
              min={1}
              max={16}
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
            />
          </div>

          <button
            type="button"
            className="mlt-btn mlt-btn-danger"
            onClick={clearAllFreeDraw}
            style={{ fontSize: "0.75rem", padding: "6px" }}
          >
            <TrashIcon size={13} /> Clear Drawings
          </button>

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
