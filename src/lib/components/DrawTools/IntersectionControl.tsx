import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { useDrawLayers } from "../../context/DrawLayersContext";
import { useAccordionContext } from "../../context/AccordionContext";
import {
  findLineIntersections,
  findPolylineSelfIntersections,
  calculateLineDistanceKm,
} from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Popover } from "../ui/Popover";
import {
  SplitIcon,
  CopyIcon,
  TrashIcon,
  CheckIcon,
  NavigationIcon,
} from "../ui/Icons";
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
  const [isIntersectMode, setIsIntersectMode] =
    useExclusiveTool("intersection");
  const { onDrawEnd, extraActions: contextExtraActions } = useMapTool();
  const { isToolVisible } = useLayerVisibility();
  const { addDrawnLayer, removeDrawnLayer, drawnLayers, isEraserMode } =
    useDrawLayers();
  const { backgroundColor } = useAccordionContext();

  const isEraserModeRef = useRef(isEraserMode);
  isEraserModeRef.current = isEraserMode;

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [intersections, setIntersections] = useState<[number, number][]>([]);
  const [hasEnoughPoints, setHasEnoughPoints] = useState(false);

  const currentLineCoordsRef = useRef<number[][]>([]);
  const hoverCoordRef = useRef<number[] | null>(null);
  const isIntersectModeRef = useRef(isIntersectMode);
  isIntersectModeRef.current = isIntersectMode;

  const mergedActions =
    propExtraActions || config?.extraActions || contextExtraActions;

  // Keep anchorEl updated to buttonRef whenever mounted
  useEffect(() => {
    if (buttonRef.current && !anchorEl) {
      setAnchorEl(buttonRef.current);
    }
  }, [anchorEl]);

  // Check map readiness
  const isMapReady = useCallback(() => {
    if (!map) return false;
    try {
      return Boolean(map.getStyle() && map.getStyle().layers);
    } catch {
      return false;
    }
  }, [map]);

  // Bring drawing draft and collision layers to the very top
  const bringLayersToFront = useCallback(() => {
    if (!map || !isMapReady()) return;
    const layersToElevate = [
      "custom-draw-lines-layer",
      "draft-intersection-layer",
      "draft-intersection-handles-layer",
      "intersection-points-pulse",
      "intersection-points-halo",
      "intersection-points-layer",
      "intersection-points-center",
    ];
    layersToElevate.forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      } catch {
        // ignore
      }
    });
  }, [map, isMapReady]);

  // Initialize draft and collision map layers
  const initMapLayers = useCallback(() => {
    if (!isMapReady()) return;

    // 1. Draft Pre-Line Layer (matches DrawLineControl draft line)
    if (!map.getSource("draft-intersection-source")) {
      map.addSource("draft-intersection-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("draft-intersection-layer")) {
      map.addLayer({
        id: "draft-intersection-layer",
        type: "line",
        source: "draft-intersection-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "#ff9500", // Standard amber pre-line
          "line-width": 4,
          "line-opacity": 0.95,
          "line-dasharray": [3, 2],
        },
      });
    }

    // 2. Draft Polyline Vertex Handles (visible points clicked by user)
    if (!map.getSource("draft-intersection-handles-source")) {
      map.addSource("draft-intersection-handles-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("draft-intersection-handles-layer")) {
      map.addLayer({
        id: "draft-intersection-handles-layer",
        type: "circle",
        source: "draft-intersection-handles-source",
        layout: {
          visibility: "visible",
        },
        paint: {
          "circle-radius": 5.5,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ff9500",
        },
      });
    }

    // 3. Accident / Collision Points Markers
    if (!map.getSource("intersection-points-source")) {
      map.addSource("intersection-points-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    // Outer glowing halo ring
    if (!map.getLayer("intersection-points-pulse")) {
      map.addLayer({
        id: "intersection-points-pulse",
        type: "circle",
        source: "intersection-points-source",
        layout: {
          visibility: isToolVisible("intersection") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 18,
          "circle-color": "#ef4444",
          "circle-opacity": 0.25,
        },
      });
    }

    // Middle halo ring
    if (!map.getLayer("intersection-points-halo")) {
      map.addLayer({
        id: "intersection-points-halo",
        type: "circle",
        source: "intersection-points-source",
        layout: {
          visibility: isToolVisible("intersection") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 11,
          "circle-color": "#ef4444",
          "circle-opacity": 0.45,
        },
      });
    }

    // Sharp accident circle marker with crisp white outline
    if (!map.getLayer("intersection-points-layer")) {
      map.addLayer({
        id: "intersection-points-layer",
        type: "circle",
        source: "intersection-points-source",
        layout: {
          visibility: isToolVisible("intersection") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 7.5,
          "circle-color": "#ef4444", // Red-500
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    // Center target dot
    if (!map.getLayer("intersection-points-center")) {
      map.addLayer({
        id: "intersection-points-center",
        type: "circle",
        source: "intersection-points-source",
        layout: {
          visibility: isToolVisible("intersection") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 2.5,
          "circle-color": "#ffffff",
        },
      });
    }

    bringLayersToFront();
  }, [map, isMapReady, isToolVisible, bringLayersToFront]);

  // Update live draft pre-line preview and vertex handles
  const updateDraftSources = useCallback(
    (liveCoords?: number[][]) => {
      if (!map || !isMapReady()) return;
      initMapLayers();

      const lineSource = map.getSource("draft-intersection-source") as any;
      const handlesSource = map.getSource(
        "draft-intersection-handles-source",
      ) as any;

      const coordsToDraw =
        liveCoords ||
        (hoverCoordRef.current && currentLineCoordsRef.current.length > 0
          ? [...currentLineCoordsRef.current, hoverCoordRef.current]
          : currentLineCoordsRef.current);

      // 1. Update rubberband pre-line
      if (lineSource) {
        if (coordsToDraw && coordsToDraw.length > 1) {
          lineSource.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: coordsToDraw },
                properties: {},
              },
            ],
          });
        } else {
          lineSource.setData({ type: "FeatureCollection", features: [] });
        }
      }

      // 2. Update vertex handles for all placed points (like draw polyline)
      if (handlesSource) {
        const handleFeatures = currentLineCoordsRef.current.map((pt, idx) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: pt },
          properties: { index: idx },
        }));

        handlesSource.setData({
          type: "FeatureCollection",
          features: handleFeatures,
        });
      }

      // 3. Elevate layers so pre-line is always above basemap & drawn layers
      try {
        if (map.getLayer("draft-intersection-layer")) {
          map.moveLayer("draft-intersection-layer");
        }
        if (map.getLayer("draft-intersection-handles-layer")) {
          map.moveLayer("draft-intersection-handles-layer");
        }
        map.triggerRepaint();
      } catch {
        // ignore
      }
    },
    [map, isMapReady, initMapLayers],
  );

  // Calculate all accident / collision points across all drawn lines
  const calculateIntersections = useCallback(() => {
    const allLines: number[][][] = [];

    if (drawnLayers && drawnLayers.length > 0) {
      drawnLayers
        .filter(
          (l) =>
            (l.tool === "line" ||
              l.tool === "freedraw" ||
              l.tool === "intersection") &&
            l.coordinates &&
            l.coordinates.length >= 2 &&
            l.visible !== false,
        )
        .forEach((l) => {
          allLines.push(l.coordinates);
        });
    }

    const found: [number, number][] = [];

    // 1. Self intersections within each line
    for (let i = 0; i < allLines.length; i++) {
      const selfPts = findPolylineSelfIntersections(allLines[i]);
      selfPts.forEach((pt) => {
        if (!found.some((p) => Math.hypot(p[0] - pt[0], p[1] - pt[1]) < 1e-5)) {
          found.push(pt);
        }
      });
    }

    // 2. Intersections between pairs of lines
    for (let i = 0; i < allLines.length; i++) {
      for (let j = i + 1; j < allLines.length; j++) {
        const crossPts = findLineIntersections(allLines[i], allLines[j]);
        crossPts.forEach((pt) => {
          if (
            !found.some((p) => Math.hypot(p[0] - pt[0], p[1] - pt[1]) < 1e-5)
          ) {
            found.push(pt);
          }
        });
      }
    }

    return found;
  }, [drawnLayers]);

  // Synchronize accident collision points on the map
  const updateSources = useCallback(() => {
    if (!map || !isMapReady()) return;
    initMapLayers();

    const ptSource = map.getSource("intersection-points-source") as any;
    if (!ptSource) return;

    const pts = calculateIntersections();
    setIntersections(pts);

    const ptFeatures = pts.map((pt, idx) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: pt },
      properties: {
        id: `intersection-point-${idx}`,
        index: idx,
        lng: pt[0],
        lat: pt[1],
      },
    }));

    ptSource.setData({ type: "FeatureCollection", features: ptFeatures });
    bringLayersToFront();
  }, [
    map,
    isMapReady,
    initMapLayers,
    calculateIntersections,
    bringLayersToFront,
  ]);

  // Recalculate whenever drawnLayers change (e.g. after adding or erasing a line)
  useEffect(() => {
    updateSources();
  }, [drawnLayers, updateSources]);

  // Finish current line drawing and save to drawnLayers so Erase tool can delete it
  const handleFinishDrawing = useCallback(() => {
    if (currentLineCoordsRef.current.length >= 2) {
      const coords = [...currentLineCoordsRef.current];
      const dist = calculateLineDistanceKm(coords);
      const lineId = `intersection-line-${Date.now()}`;
      const lineCount =
        drawnLayers.filter(
          (l) => l.tool === "line" || l.tool === "intersection",
        ).length + 1;

      // Add to drawnLayers so Eraser Tool can click and delete it!
      addDrawnLayer({
        id: lineId,
        name: `Intersection Line ${lineCount}`,
        tool: "line",
        visible: true,
        coordinates: coords,
        metrics: { distanceKm: parseFloat(dist.toFixed(2)) },
        properties: {
          id: lineId,
          name: `Intersection Line ${lineCount}`,
          color: "#4f46e5",
          width: 3.5,
          opacity: 1,
          isIntersectionLine: true,
        },
        feature: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
          properties: { id: lineId, name: `Intersection Line ${lineCount}` },
        },
        createdAt: Date.now(),
      });

      currentLineCoordsRef.current = [];
      hoverCoordRef.current = null;
      setHasEnoughPoints(false);
      updateDraftSources([]);

      setTimeout(() => {
        const pts = calculateIntersections();
        if (pts.length > 0) {
          toast.success(
            `💥 Collision detected! ${pts.length} accident point(s) marked with red circle.`,
          );
          onDrawEnd?.({
            id: lineId,
            tool: "line",
            feature: {
              type: "Feature",
              geometry: { type: "MultiPoint", coordinates: pts },
              properties: { count: pts.length },
            },
            coordinates: pts,
            properties: { count: pts.length },
            metrics: { pointCount: pts.length },
          });
        } else {
          toast.info(
            "Line added. Draw another intersecting line to calculate crossing points.",
          );
        }
      }, 50);
    } else {
      currentLineCoordsRef.current = [];
      hoverCoordRef.current = null;
      setHasEnoughPoints(false);
      updateDraftSources([]);
    }
  }, [
    addDrawnLayer,
    drawnLayers,
    updateDraftSources,
    calculateIntersections,
    onDrawEnd,
  ]);

  // Cancel current line drawing
  const handleCancelLine = () => {
    currentLineCoordsRef.current = [];
    hoverCoordRef.current = null;
    setHasEnoughPoints(false);
    updateDraftSources([]);
    toast.info("Cancelled current line drawing");
  };

  // Cursor handling and mode reset
  useEffect(() => {
    isIntersectModeRef.current = isIntersectMode;
    if (!map || !map.getCanvas()) return;

    if (isIntersectMode) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
      currentLineCoordsRef.current = [];
      hoverCoordRef.current = null;
      setHasEnoughPoints(false);
      updateDraftSources([]);
    }
  }, [isIntersectMode, map, updateDraftSources]);

  // Lifecycle & Map Event Listeners
  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateSources();
      if (currentLineCoordsRef.current.length === 0) {
        updateDraftSources([]);
      }
      bringLayersToFront();
    };

    if (isMapReady()) {
      initMapLayers();
      updateSources();
    }

    map.on("load", onStyleLoad);
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      // If Eraser mode is active, do not draw
      if (isEraserModeRef.current) return;

      if (!isIntersectModeRef.current) {
        return;
      }

      const newCoord = [
        parseFloat(e.lngLat.lng.toFixed(5)),
        parseFloat(e.lngLat.lat.toFixed(5)),
      ];

      currentLineCoordsRef.current.push(newCoord);
      if (currentLineCoordsRef.current.length >= 2) {
        setHasEnoughPoints(true);
      }

      // Update draft line and vertex handle dots immediately!
      updateDraftSources();
    };

    const handleMouseMove = (e: any) => {
      if (
        !isIntersectModeRef.current ||
        currentLineCoordsRef.current.length === 0
      ) {
        return;
      }

      // Live rubberband pre-draw line following the cursor (like DrawPolyline)
      hoverCoordRef.current = [e.lngLat.lng, e.lngLat.lat];
      updateDraftSources([
        ...currentLineCoordsRef.current,
        hoverCoordRef.current,
      ]);
    };

    const handleDblClick = (e: any) => {
      if (isIntersectModeRef.current) {
        e.preventDefault();
        handleFinishDrawing();
      }
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("load", onStyleLoad);
      map.off("style.load", onStyleLoad);
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
      map.off("dblclick", handleDblClick);
    };
  }, [
    map,
    isMapReady,
    initMapLayers,
    updateSources,
    updateDraftSources,
    handleFinishDrawing,
    bringLayersToFront,
  ]);

  // Clear all intersection lines
  const clearAll = () => {
    currentLineCoordsRef.current = [];
    hoverCoordRef.current = null;
    setHasEnoughPoints(false);
    updateDraftSources([]);

    // Remove all intersection lines from drawnLayers
    const linesToRemove = drawnLayers.filter(
      (l) =>
        l.properties?.isIntersectionLine ||
        l.id.startsWith("intersection-line-"),
    );
    linesToRemove.forEach((l) => removeDrawnLayer(l.id));

    toast.info("Cleared all intersection lines and collision markers");
  };

  const zoomToPoint = (pt: [number, number]) => {
    if (!map) return;
    map.flyTo({
      center: pt,
      zoom: 16,
      essential: true,
      duration: 1200,
    });
    toast.success(
      `Zoomed to collision point [${pt[0].toFixed(5)}, ${pt[1].toFixed(5)}]`,
    );
  };

  const totalLines = drawnLayers.filter(
    (l) =>
      l.tool === "line" || l.tool === "freedraw" || l.tool === "intersection",
  ).length;

  return (
    <>
      <button
        ref={(el) => {
          buttonRef.current = el;
          if (el && !anchorEl) setAnchorEl(el);
        }}
        type="button"
        className={`mlt-icon-btn mlt-intersection-btn ${isIntersectMode ? "mlt-icon-btn-active" : ""}`}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          setIsIntersectMode(!isIntersectMode);
        }}
        title={
          isIntersectMode
            ? "Line Intersection Active (click to turn off)"
            : "Line Intersection Detector"
        }
      >
        <SplitIcon size={18} />
      </button>

      {/* Floating Finish Checkmark Button right in toolbar when line has >= 2 points */}
      {isIntersectMode && hasEnoughPoints && (
        <button
          type="button"
          className="mlt-icon-btn"
          onClick={handleFinishDrawing}
          title="Finish Drawing Polyline"
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

      {/* Popover stays open while drawing on map; ONLY closes when tool is deactivated */}
      <Popover
        open={isIntersectMode}
        anchorEl={anchorEl || buttonRef.current}
        onClose={() => {
          // Do NOT close on map click or outside click!
          // Only close when deactivated.
        }}
        width={255}
        backgroundColor={backgroundColor}
        closeOnClickOutside={false}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>
              Intersection Detector
            </span>
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                backgroundColor: isIntersectMode ? "#10b981" : "#86868b",
                boxShadow: isIntersectMode ? "0 0 6px #10b981" : "none",
              }}
              title={isIntersectMode ? "Active" : "Inactive"}
            />
          </div>

          {/* Status Instructions */}
          <div
            style={{
              fontSize: "0.74rem",
              color: "var(--mlt-text-secondary, #86868b)",
              lineHeight: 1.4,
            }}
          >
            {!isIntersectMode
              ? "Tool paused. Click icon to resume drawing."
              : !hasEnoughPoints
                ? "Click on map to place points. Move mouse to see live pre-draw line preview."
                : "Polyline ready. Click checkmark, double-click on map, or button below to finish."}
          </div>

          {/* Action buttons while drawing */}
          {hasEnoughPoints && (
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="mlt-btn mlt-btn-primary"
                onClick={handleFinishDrawing}
                style={{ flex: 1, fontSize: "0.75rem", padding: "5px 8px" }}
              >
                <CheckIcon size={13} /> Finish Line
              </button>
              <button
                type="button"
                className="mlt-btn mlt-btn-secondary"
                onClick={handleCancelLine}
                style={{ fontSize: "0.75rem", padding: "5px 8px" }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Counts */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.78rem",
              padding: "6px 8px",
              borderRadius: "var(--mlt-radius-sm, 8px)",
              background: "var(--mlt-border, rgba(0, 0, 0, 0.05))",
            }}
          >
            <span>
              Lines on Map: <strong>{totalLines}</strong>
            </span>
            <span>
              Collisions:{" "}
              <strong
                style={{
                  color:
                    intersections.length > 0
                      ? "var(--mlt-danger, #ff3b30)"
                      : "inherit",
                }}
              >
                {intersections.length}
              </strong>
            </span>
          </div>

          {/* Detected Collisions List */}
          {intersections.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                maxHeight: "130px",
                overflowY: "auto",
              }}
            >
              {intersections.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    background: "rgba(255, 59, 48, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#ff3b30",
                      }}
                    />
                    <span style={{ fontFamily: "monospace" }}>
                      [{pt[0].toFixed(4)}, {pt[1].toFixed(4)}]
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "3px" }}>
                    <button
                      type="button"
                      className="mlt-btn mlt-btn-secondary"
                      onClick={() => zoomToPoint(pt)}
                      style={{ padding: "2px 5px", fontSize: "0.68rem" }}
                      title="Zoom"
                    >
                      <NavigationIcon size={10} />
                    </button>
                    <button
                      type="button"
                      className="mlt-btn mlt-btn-outline"
                      onClick={() => {
                        copyToClipboard(JSON.stringify(pt));
                        toast.success(`Copied Point ${i + 1}`);
                      }}
                      style={{ padding: "2px 5px", fontSize: "0.68rem" }}
                    >
                      <CopyIcon size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            {totalLines > 0 && (
              <button
                type="button"
                className="mlt-btn mlt-btn-danger"
                onClick={clearAll}
                style={{ fontSize: "0.75rem", padding: "5px 8px" }}
              >
                <TrashIcon size={12} /> Clear All
              </button>
            )}
            {intersections.length > 0 && (
              <button
                type="button"
                className="mlt-btn mlt-btn-outline"
                onClick={() => {
                  copyToClipboard(JSON.stringify(intersections));
                  toast.success("Copied all collision coordinates");
                }}
                style={{ fontSize: "0.75rem", padding: "5px 8px", flex: 1 }}
              >
                <CopyIcon size={12} /> Copy All
              </button>
            )}
          </div>

          {/* Extra Actions */}
          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "line",
              coordinates: intersections,
              properties: {
                count: intersections.length,
                linesCount: totalLines,
              },
              metrics: { pointCount: intersections.length },
              map,
              closeModal: () => setIsIntersectMode(false),
            }}
          />
        </div>
      </Popover>
    </>
  );
};

export default IntersectionControl;
