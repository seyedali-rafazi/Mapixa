import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { useDrawLayers } from "../../context/DrawLayersContext";
import { calculatePolygonAreaSqM } from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Modal } from "../ui/Modal";
import { RectangleIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface RectangleItem {
  id: string;
  name: string;
  p1: [number, number]; // [lng1, lat1]
  p2: [number, number]; // [lng2, lat2]
  fillColor: string;
  fillOpacity: number;
  outlineColor: string;
  areaSqKm?: number;
}

const initialRectState: RectangleItem = {
  id: "",
  name: "",
  p1: [0, 0],
  p2: [0, 0],
  fillColor: "#34c759",
  fillOpacity: 30,
  outlineColor: "#248a3d",
};

export const getRectCoordinates = (p1: [number, number], p2: [number, number]): number[][] => {
  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;
  return [
    [lng1, lat1],
    [lng2, lat1],
    [lng2, lat2],
    [lng1, lat2],
    [lng1, lat1],
  ];
};

export interface DrawRectangleControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const DrawRectangleControl: FC<DrawRectangleControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isRectMode, setIsRectMode] = useExclusiveTool("rectangle");
  const { onDrawEnd, onDrawDelete, afterDrawMode, extraActions: contextExtraActions } =
    useMapTool();
  const { isToolVisible } = useLayerVisibility();
  const { addDrawnLayer, removeDrawnLayer, drawnLayers, isEraserMode } = useDrawLayers();
  const isEraserModeRef = useRef(isEraserMode);
  isEraserModeRef.current = isEraserMode;

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [rectData, setRectData] = useState<RectangleItem>(initialRectState);

  const rectDataRef = useRef<RectangleItem[]>([]);
  const startPointRef = useRef<[number, number] | null>(null);
  const isRectModeRef = useRef(isRectMode);

  useEffect(() => {
    const currentRects = drawnLayers
      .filter((l) => l.tool === "rectangle")
      .map(
        (l) =>
          ({
            id: l.id,
            name: l.name,
            p1: l.coordinates?.[0] || l.properties?.p1 || [0, 0],
            p2: l.coordinates?.[1] || l.properties?.p2 || [0, 0],
            fillColor: l.properties?.fillColor || "#34c759",
            fillOpacity: (l.properties?.fillOpacity ?? 0.3) * 100,
            outlineColor: l.properties?.outlineColor || "#248a3d",
            areaSqKm: l.metrics?.areaSqKm,
          }) as RectangleItem
      );
    rectDataRef.current = currentRects;
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

    if (!map.getSource("custom-rect-source")) {
      map.addSource("custom-rect-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("custom-rect-fill")) {
      map.addLayer({
        id: "custom-rect-fill",
        type: "fill",
        source: "custom-rect-source",
        layout: {
          visibility: isToolVisible("rectangle") ? "visible" : "none",
        },
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      });
    }

    if (!map.getLayer("custom-rect-outline")) {
      map.addLayer({
        id: "custom-rect-outline",
        type: "line",
        source: "custom-rect-source",
        layout: {
          visibility: isToolVisible("rectangle") ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "outlineColor"],
          "line-width": 2.5,
        },
      });
    }
  }, [map, isToolVisible, isMapReady]);

  const updateSourceData = useCallback(
    (draftRect?: RectangleItem | null) => {
      if (!map) return;
      initMapLayers();

      const source = map.getSource("custom-rect-source") as any;
      if (!source) return;

      const features: any[] = [];
      if (draftRect && draftRect.p1 && draftRect.p2) {
        features.push({
          type: "Feature",
          properties: {
            id: draftRect.id || "draft-rectangle",
            name: draftRect.name || "Draft Rectangle",
            fillColor: draftRect.fillColor || "#34c759",
            fillOpacity: (draftRect.fillOpacity ?? 30) / 100,
            outlineColor: draftRect.outlineColor || "#34c759",
          },
          geometry: {
            type: "Polygon",
            coordinates: [getRectCoordinates(draftRect.p1, draftRect.p2)],
          },
        });
      }

      source.setData({ type: "FeatureCollection", features });
      try {
        map.triggerRepaint();
      } catch {
        // ignore
      }
    },
    [map, initMapLayers]
  );

  useEffect(() => {
    isRectModeRef.current = isRectMode;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isRectMode ? "crosshair" : "";
    }

    if (!isRectMode) {
      startPointRef.current = null;
      if (!open) {
        updateSourceData(null);
      }
    }
  }, [isRectMode, map, updateSourceData, open]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateSourceData(null);
    };

    if (isMapReady()) initMapLayers();
    map.on("style.load", onStyleLoad);
    map.on("load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (isEraserModeRef.current) return;

      const layersToCheck = [
        map.getLayer("custom-draw-shapes-fill") ? "custom-draw-shapes-fill" : null,
        map.getLayer("custom-rect-fill") ? "custom-rect-fill" : null,
      ].filter(Boolean) as string[];

      if (!isRectModeRef.current && layersToCheck.length > 0) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: layersToCheck,
        });
        if (features.length > 0) {
          const clickedId = features[0].properties?.id;
          const rect = rectDataRef.current.find((r) => r.id === clickedId);
          if (rect) {
            e.preventDefault();
            setRectData(rect);
            setOpen(true);
            return;
          }
        }
      }

      if (isRectModeRef.current) {
        const point: [number, number] = [
          parseFloat(e.lngLat.lng.toFixed(5)),
          parseFloat(e.lngLat.lat.toFixed(5)),
        ];

        if (!startPointRef.current) {
          startPointRef.current = point;
          toast.info("Move cursor and click opposite corner to finish rectangle");
        } else {
          const p1 = startPointRef.current;
          const p2 = point;
          const coords = getRectCoordinates(p1, p2);
          const areaSqM = calculatePolygonAreaSqM(coords);
          const areaSqKm = parseFloat((areaSqM / 1_000_000).toFixed(3));

          const newRect: RectangleItem = {
            ...initialRectState,
            id: `rectangle-${Date.now()}`,
            name: `Rectangle ${rectDataRef.current.length + 1}`,
            p1,
            p2,
            areaSqKm,
          };

          if (afterDrawMode === "auto-save") {
            addDrawnLayer({
              id: newRect.id,
              name: newRect.name,
              tool: "rectangle",
              visible: true,
              coordinates: [p1, p2],
              metrics: { areaSqKm: newRect.areaSqKm },
              properties: {
                id: newRect.id,
                name: newRect.name,
                fillColor: newRect.fillColor,
                fillOpacity: newRect.fillOpacity / 100,
                outlineColor: newRect.outlineColor,
                p1,
                p2,
              },
              feature: {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [coords],
                },
                properties: { id: newRect.id, name: newRect.name },
              },
              createdAt: Date.now(),
            });
            updateSourceData(null);
            onDrawEnd?.({
              id: newRect.id,
              tool: "rectangle",
              feature: {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [coords],
                },
                properties: { id: newRect.id, name: newRect.name },
              },
              coordinates: [p1, p2],
              properties: { ...newRect },
              metrics: { areaSqKm: newRect.areaSqKm },
            });
            toast.success(`Rectangle created (${newRect.areaSqKm} km²)`);
          } else {
            setRectData(newRect);
            setOpen(true);
            // Keep draft rectangle visible on map while modal is open
            updateSourceData(newRect);
          }

          startPointRef.current = null;
          setIsRectMode(false);
        }
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isRectModeRef.current || !startPointRef.current) return;
      const hoverPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      updateSourceData({
        ...initialRectState,
        id: "draft-rectangle",
        p1: startPointRef.current,
        p2: hoverPt,
      });
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("load", onStyleLoad);
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
    };
  }, [map, initMapLayers, updateSourceData, isRectMode, setIsRectMode, afterDrawMode, onDrawEnd, addDrawnLayer, isMapReady]);

  const handleCloseModal = () => {
    setOpen(false);
    updateSourceData(null);
  };

  const handlePropertyChange = (updates: Partial<RectangleItem>) => {
    setRectData((prev) => {
      const next = { ...prev, ...updates };
      // Live preview update for unsaved draft rectangle
      if (!drawnLayers.some((l) => l.id === next.id)) {
        updateSourceData(next);
      }
      return next;
    });
  };

  const handleSave = () => {
    const coords = getRectCoordinates(rectData.p1, rectData.p2);
    addDrawnLayer({
      id: rectData.id,
      name: rectData.name,
      tool: "rectangle",
      visible: true,
      coordinates: [rectData.p1, rectData.p2],
      metrics: { areaSqKm: rectData.areaSqKm },
      properties: {
        id: rectData.id,
        name: rectData.name,
        fillColor: rectData.fillColor,
        fillOpacity: rectData.fillOpacity / 100,
        outlineColor: rectData.outlineColor,
        p1: rectData.p1,
        p2: rectData.p2,
      },
      feature: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
        properties: { id: rectData.id, name: rectData.name },
      },
      createdAt: Date.now(),
    });

    updateSourceData(null);

    onDrawEnd?.({
      id: rectData.id,
      tool: "rectangle",
      feature: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
        properties: { id: rectData.id, name: rectData.name },
      },
      coordinates: [rectData.p1, rectData.p2],
      properties: { ...rectData },
      metrics: { areaSqKm: rectData.areaSqKm },
    });

    setOpen(false);
    toast.success("Rectangle saved");
  };

  const handleDelete = () => {
    removeDrawnLayer(rectData.id);
    updateSourceData(null);
    onDrawDelete?.({ id: rectData.id, tool: "rectangle" });
    setOpen(false);
    toast.info("Rectangle deleted");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isRectMode ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsRectMode(!isRectMode)}
        title={
          isRectMode
            ? "Click corner 1, then click corner 2 to draw rectangle"
            : "Draw Custom Rectangle"
        }
      >
        <RectangleIcon size={18} />
      </button>

      <Modal
        open={open}
        onClose={handleCloseModal}
        title={rectData.id ? "Edit Rectangle" : "New Rectangle"}
        footer={
          <div className="mlt-modal-footer">
            {rectDataRef.current.some((r) => r.id === rectData.id) && (
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
            value={rectData.name}
            onChange={(e) => handlePropertyChange({ name: e.target.value })}
            placeholder="e.g. Bounding Box"
          />
        </div>

        {rectData.areaSqKm !== undefined && (
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb" }}>
            Area: {rectData.areaSqKm} km²
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
          <div className="mlt-form-group">
            <label className="mlt-label">Fill Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={rectData.fillColor}
              onChange={(e) => handlePropertyChange({ fillColor: e.target.value })}
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">Outline Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={rectData.outlineColor}
              onChange={(e) => handlePropertyChange({ outlineColor: e.target.value })}
            />
          </div>
        </div>

        <div className="mlt-form-group">
          <label className="mlt-label">
            Fill Opacity ({rectData.fillOpacity}%)
          </label>
          <input
            type="range"
            className="mlt-slider"
            min={5}
            max={100}
            value={rectData.fillOpacity}
            onChange={(e) =>
              handlePropertyChange({
                fillOpacity: Number(e.target.value),
              })
            }
          />
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
                      type: "Polygon",
                      coordinates: [getRectCoordinates(rectData.p1, rectData.p2)],
                    },
                    properties: {
                      name: rectData.name,
                      areaSqKm: rectData.areaSqKm,
                    },
                  })
                );
                toast.success("Copied Rectangle GeoJSON");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <CopyIcon size={13} /> Copy GeoJSON
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "rectangle",
              coordinates: [rectData.p1, rectData.p2],
              properties: { ...rectData },
              metrics: { areaSqKm: rectData.areaSqKm },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default DrawRectangleControl;
