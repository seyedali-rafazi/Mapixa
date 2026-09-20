import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import {
  calculateDistanceKm,
  calculateLineDistanceKm,
  getMidpoint,
} from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Modal } from "../ui/Modal";
import { RulerIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface DrawRulerControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const DrawRulerControl: FC<DrawRulerControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isRulerMode, setIsRulerMode] = useExclusiveTool("ruler");
  const { onDrawEnd, extraActions: contextExtraActions } = useMapTool();
  const { isToolVisible } = useLayerVisibility();

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [totalKm, setTotalKm] = useState(0);

  const coordinatesRef = useRef<number[][]>([]);
  const cursorPointRef = useRef<number[] | null>(null);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    if (!map.getSource("ruler-line-source")) {
      map.addSource("ruler-line-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getSource("ruler-label-source")) {
      map.addSource("ruler-label-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getSource("ruler-points-source")) {
      map.addSource("ruler-points-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("ruler-line-layer")) {
      map.addLayer({
        id: "ruler-line-layer",
        type: "line",
        source: "ruler-line-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: isToolVisible("ruler") ? "visible" : "none",
        },
        paint: {
          "line-color": "#ff3b30",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });
    }

    if (!map.getLayer("ruler-points-layer")) {
      map.addLayer({
        id: "ruler-points-layer",
        type: "circle",
        source: "ruler-points-source",
        layout: {
          visibility: isToolVisible("ruler") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ff3b30",
        },
      });
    }

    if (!map.getLayer("ruler-label-layer")) {
      map.addLayer({
        id: "ruler-label-layer",
        type: "symbol",
        source: "ruler-label-source",
        layout: {
          "text-field": ["get", "distance"],
          "text-size": 12,
          "text-offset": [0, -1.2],
          "text-anchor": "center",
          "text-allow-overlap": true,
          visibility: isToolVisible("ruler") ? "visible" : "none",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#ff3b30",
          "text-halo-width": 3,
        },
      });
    }
  }, [map, isToolVisible]);

  const updateMapData = useCallback(() => {
    if (!map) return;
    initMapLayers();

    const lineSource = map.getSource("ruler-line-source") as any;
    const labelSource = map.getSource("ruler-label-source") as any;
    const ptSource = map.getSource("ruler-points-source") as any;

    const activePoints = [...coordinatesRef.current];
    if (cursorPointRef.current && isRulerMode) {
      activePoints.push(cursorPointRef.current);
    }

    if (lineSource) {
      lineSource.setData({
        type: "FeatureCollection",
        features:
          activePoints.length > 1
            ? [
                {
                  type: "Feature",
                  geometry: { type: "LineString", coordinates: activePoints },
                  properties: {},
                },
              ]
            : [],
      });
    }

    if (ptSource) {
      ptSource.setData({
        type: "FeatureCollection",
        features: activePoints.map((pt) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: pt },
          properties: {},
        })),
      });
    }

    if (labelSource) {
      const labelFeatures: any[] = [];
      let runningDist = 0;

      for (let i = 0; i < activePoints.length - 1; i++) {
        const p1 = activePoints[i] as [number, number];
        const p2 = activePoints[i + 1] as [number, number];
        const segDist = calculateDistanceKm(p1, p2);
        runningDist += segDist;

        labelFeatures.push({
          type: "Feature",
          properties: {
            distance: `${segDist.toFixed(2)} km`,
          },
          geometry: {
            type: "Point",
            coordinates: getMidpoint(p1, p2),
          },
        });
      }

      if (activePoints.length > 1) {
        const lastPt = activePoints[activePoints.length - 1];
        labelFeatures.push({
          type: "Feature",
          properties: {
            distance: `Total: ${runningDist.toFixed(2)} km`,
          },
          geometry: {
            type: "Point",
            coordinates: lastPt,
          },
        });
      }

      labelSource.setData({
        type: "FeatureCollection",
        features: labelFeatures,
      });
    }
  }, [map, isRulerMode, initMapLayers]);

  useEffect(() => {
    if (!map) return;
    if (isRulerMode) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
      cursorPointRef.current = null;
      updateMapData();
    }
  }, [isRulerMode, map, updateMapData]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateMapData();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (!isRulerMode) return;
      const point = [e.lngLat.lng, e.lngLat.lat];
      coordinatesRef.current.push(point);
      updateMapData();
    };

    const handleMouseMove = (e: any) => {
      if (!isRulerMode || coordinatesRef.current.length === 0) return;
      cursorPointRef.current = [e.lngLat.lng, e.lngLat.lat];
      updateMapData();
    };

    const handleDblClick = (e: any) => {
      if (!isRulerMode) return;
      e.preventDefault();

      if (coordinatesRef.current.length > 1) {
        const dist = calculateLineDistanceKm(coordinatesRef.current);
        const roundedDist = parseFloat(dist.toFixed(2));
        setTotalKm(roundedDist);
        setOpen(true);

        onDrawEnd?.({
          id: `ruler-${Date.now()}`,
          tool: "ruler",
          feature: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coordinatesRef.current,
            },
            properties: { distanceKm: roundedDist },
          },
          coordinates: coordinatesRef.current,
          properties: { distanceKm: roundedDist },
          metrics: { distanceKm: roundedDist },
        });

        toast.success(`Measurement finished: ${roundedDist} km`);
      }

      cursorPointRef.current = null;
      setIsRulerMode(false);
      updateMapData();
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
  }, [map, isRulerMode, setIsRulerMode, initMapLayers, updateMapData, onDrawEnd]);

  const clearRuler = () => {
    coordinatesRef.current = [];
    cursorPointRef.current = null;
    updateMapData();
    setOpen(false);
    toast.info("Cleared ruler measurement");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isRulerMode ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsRulerMode(!isRulerMode)}
        title={
          isRulerMode
            ? "Click points to measure distance. Double click to finish"
            : "Distance Ruler"
        }
      >
        <RulerIcon size={18} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Distance Measurement"
        footer={
          <div className="mlt-modal-footer">
            <button
              type="button"
              className="mlt-btn mlt-btn-danger"
              onClick={clearRuler}
              style={{ marginRight: "auto" }}
            >
              <TrashIcon size={14} /> Clear
            </button>
            <button
              type="button"
              className="mlt-btn mlt-btn-primary"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563eb", marginBottom: "4px" }}>
          {totalKm} km
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--mlt-text-muted)" }}>
          Points measured: {coordinatesRef.current.length}
        </div>

        {/* Extra Actions */}
        <div style={{ marginTop: "12px", borderTop: "1px solid var(--mlt-border)", paddingTop: "12px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mlt-text-muted)", marginBottom: "8px" }}>
            Quick Actions:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
            <button
              type="button"
              className="mlt-btn mlt-btn-outline"
              onClick={() => {
                copyToClipboard(`${totalKm} km`);
                toast.success("Distance copied to clipboard");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <CopyIcon size={13} /> Copy Distance
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "ruler",
              coordinates: coordinatesRef.current,
              metrics: { distanceKm: totalKm },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default DrawRulerControl;
