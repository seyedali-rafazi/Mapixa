import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import {
  calculateDistanceKm,
  createGeoJSONCircle,
} from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Modal } from "../ui/Modal";
import { CircleIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface CircleItem {
  id: string;
  name: string;
  center: [number, number];
  radiusKm: number;
  fillColor: string;
  fillOpacity: number;
  outlineColor: string;
  areaSqKm?: number;
}

const initialCircleState: CircleItem = {
  id: "",
  name: "",
  center: [0, 0],
  radiusKm: 1,
  fillColor: "#007aff",
  fillOpacity: 30,
  outlineColor: "#0051a8",
};

export interface DrawCircleControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const DrawCircleControl: FC<DrawCircleControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isCircleMode, setIsCircleMode] = useExclusiveTool("circle");
  const { onDrawEnd, onDrawDelete, afterDrawMode, extraActions: contextExtraActions } =
    useMapTool();
  const { isToolVisible } = useLayerVisibility();

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [circleData, setCircleData] = useState<CircleItem>(initialCircleState);

  const circleDataRef = useRef<CircleItem[]>([]);
  const activeCenterRef = useRef<[number, number] | null>(null);
  const isCircleModeRef = useRef(isCircleMode);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    if (!map.getSource("custom-circle-source")) {
      map.addSource("custom-circle-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("custom-circle-fill")) {
      map.addLayer({
        id: "custom-circle-fill",
        type: "fill",
        source: "custom-circle-source",
        layout: {
          visibility: isToolVisible("circle") ? "visible" : "none",
        },
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      });
    }

    if (!map.getLayer("custom-circle-outline")) {
      map.addLayer({
        id: "custom-circle-outline",
        type: "line",
        source: "custom-circle-source",
        layout: {
          visibility: isToolVisible("circle") ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "outlineColor"],
          "line-width": 2.5,
        },
      });
    }
  }, [map, isToolVisible]);

  const updateSourceData = useCallback(
    (draftCircle?: CircleItem | null) => {
      if (!map) return;
      initMapLayers();

      const source = map.getSource("custom-circle-source") as any;
      if (!source) return;

      const features = circleDataRef.current.map((c) => ({
        type: "Feature",
        properties: {
          id: c.id,
          name: c.name,
          fillColor: c.fillColor,
          fillOpacity: c.fillOpacity / 100,
          outlineColor: c.outlineColor,
        },
        geometry: {
          type: "Polygon",
          coordinates: [createGeoJSONCircle(c.center, c.radiusKm)],
        },
      }));

      if (draftCircle) {
        features.push({
          type: "Feature",
          properties: {
            id: "draft-circle",
            name: "Draft Circle",
            fillColor: "#007aff",
            fillOpacity: 0.25,
            outlineColor: "#007aff",
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              createGeoJSONCircle(draftCircle.center, draftCircle.radiusKm),
            ],
          },
        });
      }

      source.setData({ type: "FeatureCollection", features });
    },
    [map, initMapLayers]
  );

  useEffect(() => {
    isCircleModeRef.current = isCircleMode;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isCircleMode ? "crosshair" : "";
    }

    if (!isCircleMode) {
      activeCenterRef.current = null;
      updateSourceData();
    }
  }, [isCircleMode, map, updateSourceData]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateSourceData();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (!isCircleModeRef.current && map.getLayer("custom-circle-fill")) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["custom-circle-fill"],
        });
        if (features.length > 0) {
          e.preventDefault();
          const clickedId = features[0].properties?.id;
          const circle = circleDataRef.current.find((c) => c.id === clickedId);
          if (circle) {
            setCircleData(circle);
            setOpen(true);
          }
          return;
        }
      }

      if (isCircleModeRef.current) {
        const point: [number, number] = [
          parseFloat(e.lngLat.lng.toFixed(5)),
          parseFloat(e.lngLat.lat.toFixed(5)),
        ];

        if (!activeCenterRef.current) {
          // First click sets center
          activeCenterRef.current = point;
          toast.info("Move cursor and click to set circle radius");
        } else {
          // Second click completes circle
          const center = activeCenterRef.current;
          const radiusKm = parseFloat(calculateDistanceKm(center, point).toFixed(2));
          const effectiveRadius = Math.max(0.05, radiusKm);
          const areaSqKm = parseFloat((Math.PI * effectiveRadius * effectiveRadius).toFixed(2));

          const newCircle: CircleItem = {
            ...initialCircleState,
            id: `circle-${Date.now()}`,
            name: `Circle ${circleDataRef.current.length + 1}`,
            center,
            radiusKm: effectiveRadius,
            areaSqKm,
          };

          if (afterDrawMode === "auto-save") {
            circleDataRef.current.push(newCircle);
            updateSourceData();
            onDrawEnd?.({
              id: newCircle.id,
              tool: "circle",
              feature: {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [createGeoJSONCircle(newCircle.center, newCircle.radiusKm)],
                },
                properties: { id: newCircle.id, name: newCircle.name },
              },
              coordinates: newCircle.center,
              properties: { ...newCircle },
              metrics: { radiusKm: newCircle.radiusKm, areaSqKm: newCircle.areaSqKm },
            });
            toast.success(`Circle created (radius ${newCircle.radiusKm} km)`);
          } else {
            setCircleData(newCircle);
            setOpen(true);
          }

          activeCenterRef.current = null;
          setIsCircleMode(false);
          updateSourceData();
        }
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isCircleModeRef.current || !activeCenterRef.current) return;
      const hoverPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const radiusKm = Math.max(
        0.05,
        calculateDistanceKm(activeCenterRef.current, hoverPt)
      );
      updateSourceData({
        ...initialCircleState,
        id: "draft-circle",
        center: activeCenterRef.current,
        radiusKm,
      });
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
    };
  }, [map, initMapLayers, updateSourceData, isCircleMode, setIsCircleMode, afterDrawMode, onDrawEnd]);

  const handleSave = () => {
    const existingIndex = circleDataRef.current.findIndex(
      (c) => c.id === circleData.id
    );
    if (existingIndex >= 0) {
      circleDataRef.current[existingIndex] = circleData;
    } else {
      circleDataRef.current.push(circleData);
    }

    updateSourceData();

    onDrawEnd?.({
      id: circleData.id,
      tool: "circle",
      feature: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [createGeoJSONCircle(circleData.center, circleData.radiusKm)],
        },
        properties: { id: circleData.id, name: circleData.name },
      },
      coordinates: circleData.center,
      properties: { ...circleData },
      metrics: { radiusKm: circleData.radiusKm, areaSqKm: circleData.areaSqKm },
    });

    setOpen(false);
    toast.success("Circle saved");
  };

  const handleDelete = () => {
    circleDataRef.current = circleDataRef.current.filter((c) => c.id !== circleData.id);
    updateSourceData();
    onDrawDelete?.({ id: circleData.id, tool: "circle" });
    setOpen(false);
    toast.info("Circle deleted");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isCircleMode ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsCircleMode(!isCircleMode)}
        title={
          isCircleMode
            ? "Click center, then move mouse and click to set radius"
            : "Draw Custom Circle"
        }
      >
        <CircleIcon size={18} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={circleData.id ? "Edit Circle" : "New Circle"}
        footer={
          <div className="mlt-modal-footer">
            {circleDataRef.current.some((c) => c.id === circleData.id) && (
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
            value={circleData.name}
            onChange={(e) =>
              setCircleData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Coverage Zone"
          />
        </div>

        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb" }}>
          Radius: {circleData.radiusKm} km | Area: {circleData.areaSqKm} km²
        </div>

        <div className="mlt-form-group">
          <label className="mlt-label">
            Radius ({circleData.radiusKm} km)
          </label>
          <input
            type="range"
            className="mlt-slider"
            min={0.1}
            max={50}
            step={0.1}
            value={circleData.radiusKm}
            onChange={(e) => {
              const r = Number(e.target.value);
              setCircleData((prev) => ({
                ...prev,
                radiusKm: r,
                areaSqKm: parseFloat((Math.PI * r * r).toFixed(2)),
              }));
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
          <div className="mlt-form-group">
            <label className="mlt-label">Fill Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={circleData.fillColor}
              onChange={(e) =>
                setCircleData((prev) => ({ ...prev, fillColor: e.target.value }))
              }
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">Outline Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={circleData.outlineColor}
              onChange={(e) =>
                setCircleData((prev) => ({ ...prev, outlineColor: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mlt-form-group">
          <label className="mlt-label">
            Fill Opacity ({circleData.fillOpacity}%)
          </label>
          <input
            type="range"
            className="mlt-slider"
            min={5}
            max={100}
            value={circleData.fillOpacity}
            onChange={(e) =>
              setCircleData((prev) => ({
                ...prev,
                fillOpacity: Number(e.target.value),
              }))
            }
          />
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
                copyToClipboard(
                  JSON.stringify({
                    type: "Feature",
                    geometry: {
                      type: "Polygon",
                      coordinates: [
                        createGeoJSONCircle(circleData.center, circleData.radiusKm),
                      ],
                    },
                    properties: {
                      name: circleData.name,
                      radiusKm: circleData.radiusKm,
                      areaSqKm: circleData.areaSqKm,
                    },
                  })
                );
                toast.success("Copied Circle GeoJSON");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <CopyIcon size={13} /> Copy GeoJSON
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "circle",
              coordinates: circleData.center,
              properties: { ...circleData },
              metrics: { radiusKm: circleData.radiusKm, areaSqKm: circleData.areaSqKm },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default DrawCircleControl;
