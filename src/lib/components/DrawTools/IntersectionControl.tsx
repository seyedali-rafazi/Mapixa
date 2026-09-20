import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { getLineIntersection } from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Modal } from "../ui/Modal";
import { SplitIcon, CopyIcon, TrashIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface IntersectionControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const IntersectionControl: FC<IntersectionControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isIntersectMode, setIsIntersectMode] = useExclusiveTool("intersection");
  const { onDrawEnd, extraActions: contextExtraActions } = useMapTool();
  const { isToolVisible } = useLayerVisibility();

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [intersections, setIntersections] = useState<[number, number][]>([]);

  const linesRef = useRef<number[][][]>([]);
  const currentLineRef = useRef<number[][]>([]);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    if (!map.getSource("intersection-lines-source")) {
      map.addSource("intersection-lines-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("intersection-lines-layer")) {
      map.addLayer({
        id: "intersection-lines-layer",
        type: "line",
        source: "intersection-lines-source",
        layout: {
          visibility: isToolVisible("line") ? "visible" : "none",
        },
        paint: {
          "line-color": "#5856d6",
          "line-width": 3,
        },
      });
    }

    if (!map.getSource("intersection-points-source")) {
      map.addSource("intersection-points-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("intersection-points-layer")) {
      map.addLayer({
        id: "intersection-points-layer",
        type: "circle",
        source: "intersection-points-source",
        layout: {
          visibility: isToolVisible("marker") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 7,
          "circle-color": "#ff3b30",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }
  }, [map, isToolVisible]);

  const calculateIntersections = useCallback(() => {
    const lines = linesRef.current;
    const found: [number, number][] = [];

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const l1 = lines[i];
        const l2 = lines[j];

        for (let a = 0; a < l1.length - 1; a++) {
          for (let b = 0; b < l2.length - 1; b++) {
            const pt = getLineIntersection(
              l1[a] as [number, number],
              l1[a + 1] as [number, number],
              l2[b] as [number, number],
              l2[b + 1] as [number, number]
            );
            if (pt) found.push(pt);
          }
        }
      }
    }
    return found;
  }, []);

  const updateSources = useCallback(() => {
    if (!map) return;
    initMapLayers();

    const lineSource = map.getSource("intersection-lines-source") as any;
    const ptSource = map.getSource("intersection-points-source") as any;
    if (!lineSource || !ptSource) return;

    const lineFeatures = linesRef.current.map((lineCoords) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: lineCoords },
      properties: {},
    }));

    const pts = calculateIntersections();
    setIntersections(pts);

    const ptFeatures = pts.map((pt, idx) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: pt },
      properties: { id: idx },
    }));

    lineSource.setData({ type: "FeatureCollection", features: lineFeatures });
    ptSource.setData({ type: "FeatureCollection", features: ptFeatures });
  }, [map, initMapLayers, calculateIntersections]);

  useEffect(() => {
    if (!map) return;
    const onStyleLoad = () => {
      initMapLayers();
      updateSources();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (!isIntersectMode) return;
      const coord = [
        parseFloat(e.lngLat.lng.toFixed(5)),
        parseFloat(e.lngLat.lat.toFixed(5)),
      ];
      currentLineRef.current.push(coord);

      if (currentLineRef.current.length === 2) {
        linesRef.current.push([...currentLineRef.current]);
        currentLineRef.current = [];
        updateSources();

        const pts = calculateIntersections();
        if (pts.length > 0) {
          toast.success(`Found ${pts.length} intersection(s)!`);
          setOpen(true);
          onDrawEnd?.({
            id: `intersection-${Date.now()}`,
            tool: "line",
            feature: {
              type: "Feature",
              geometry: {
                type: "MultiPoint",
                coordinates: pts,
              },
              properties: { count: pts.length },
            },
            coordinates: pts,
            properties: { count: pts.length },
            metrics: { pointCount: pts.length },
          });
        } else {
          toast.info("Line added. Draw another intersecting line to find crossings.");
        }
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("click", handleMapClick);
    };
  }, [map, isIntersectMode, initMapLayers, updateSources, calculateIntersections, onDrawEnd]);

  const clearAll = () => {
    linesRef.current = [];
    currentLineRef.current = [];
    updateSources();
    setOpen(false);
    toast.info("Cleared lines and intersections");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isIntersectMode ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsIntersectMode(!isIntersectMode)}
        title={
          isIntersectMode
            ? "Click 2 points per line segment to compute intersections"
            : "Line Intersection Detector"
        }
      >
        <SplitIcon size={18} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Line Intersections"
        footer={
          <div className="mlt-modal-footer">
            <button
              type="button"
              className="mlt-btn mlt-btn-danger"
              onClick={clearAll}
              style={{ marginRight: "auto" }}
            >
              <TrashIcon size={14} /> Clear All
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
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb", marginBottom: "8px" }}>
          Detected: {intersections.length} Intersection Point(s)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "160px", overflowY: "auto" }}>
          {intersections.map((pt, i) => (
            <div key={i} style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--mlt-text)" }}>
              Point {i + 1}: [{pt[0].toFixed(5)}, {pt[1].toFixed(5)}]
            </div>
          ))}
        </div>

        {/* Extra Actions */}
        <div style={{ marginTop: "8px", borderTop: "1px solid var(--mlt-border)", paddingTop: "12px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mlt-text-muted)", marginBottom: "8px" }}>
            Quick Actions:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
            <button
              type="button"
              className="mlt-btn mlt-btn-outline"
              onClick={() => {
                copyToClipboard(JSON.stringify(intersections));
                toast.success("Copied intersection coordinates");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <CopyIcon size={13} /> Copy Points
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "line",
              coordinates: intersections,
              properties: { count: intersections.length },
              metrics: { pointCount: intersections.length },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default IntersectionControl;
