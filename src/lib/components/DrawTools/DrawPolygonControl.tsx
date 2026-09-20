import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { calculatePolygonAreaSqM } from "../../utils/geoCalculations";
import { copyToClipboard } from "../../utils/exportUtils";
import { Modal } from "../ui/Modal";
import { PolygonIcon, CheckIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface PolygonItem {
  id: string;
  name: string;
  fillColor: string;
  fillOpacity: number;
  outlineColor: string;
  vertices: number[][];
  areaSqM?: number;
  areaSqKm?: number;
}

const initialPolygonState: PolygonItem = {
  id: "",
  name: "",
  fillColor: "#ff9500",
  fillOpacity: 35,
  outlineColor: "#e08500",
  vertices: [],
};

export interface DrawPolygonControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const DrawPolygonControl: FC<DrawPolygonControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isPolyMode, setIsPolyMode] = useExclusiveTool("polygon");
  const { onDrawEnd, onDrawDelete, afterDrawMode, extraActions: contextExtraActions } =
    useMapTool();
  const { isToolVisible } = useLayerVisibility();

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [polyData, setPolyData] = useState<PolygonItem>(initialPolygonState);
  const [hasEnoughPoints, setHasEnoughPoints] = useState(false);

  const polyDataRef = useRef<PolygonItem[]>([]);
  const currentVerticesRef = useRef<number[][]>([]);
  const hoverLngLatRef = useRef<number[] | null>(null);
  const isPolyModeRef = useRef(isPolyMode);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    if (!map.getSource("custom-poly-source")) {
      map.addSource("custom-poly-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getSource("custom-poly-handles")) {
      map.addSource("custom-poly-handles", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("custom-poly-fill")) {
      map.addLayer({
        id: "custom-poly-fill",
        type: "fill",
        source: "custom-poly-source",
        filter: ["==", ["geometry-type"], "Polygon"],
        layout: {
          visibility: isToolVisible("polygon") ? "visible" : "none",
        },
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      });
    }

    if (!map.getLayer("custom-poly-outline")) {
      map.addLayer({
        id: "custom-poly-outline",
        type: "line",
        source: "custom-poly-source",
        layout: {
          visibility: isToolVisible("polygon") ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "outlineColor"],
          "line-width": 2.5,
        },
      });
    }

    if (!map.getLayer("custom-poly-handles-layer")) {
      map.addLayer({
        id: "custom-poly-handles-layer",
        type: "circle",
        source: "custom-poly-handles",
        layout: {
          visibility: isToolVisible("polygon") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 6,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ff9500",
        },
      });
    }
  }, [map, isToolVisible]);

  const updateSourceData = useCallback(() => {
    if (!map) return;
    initMapLayers();

    const polySource = map.getSource("custom-poly-source") as any;
    const handleSource = map.getSource("custom-poly-handles") as any;
    if (!polySource || !handleSource) return;

    const features: any[] = [];
    const handleFeatures: any[] = [];

    // Add completed polygons
    polyDataRef.current.forEach((poly) => {
      if (poly.vertices.length >= 3) {
        const closedCoords = [...poly.vertices, poly.vertices[0]];
        features.push({
          type: "Feature",
          properties: {
            id: poly.id,
            name: poly.name,
            fillColor: poly.fillColor,
            fillOpacity: poly.fillOpacity / 100,
            outlineColor: poly.outlineColor,
          },
          geometry: {
            type: "Polygon",
            coordinates: [closedCoords],
          },
        });
      }
    });

    // Add drafting polygon
    if (isPolyModeRef.current && currentVerticesRef.current.length > 0) {
      const draftCoords = [...currentVerticesRef.current];
      if (hoverLngLatRef.current) {
        draftCoords.push(hoverLngLatRef.current);
      }

      if (draftCoords.length >= 3) {
        const closedDraft = [...draftCoords, draftCoords[0]];
        features.push({
          type: "Feature",
          properties: {
            id: "draft-polygon",
            fillColor: "#ff9500",
            fillOpacity: 0.25,
            outlineColor: "#ff9500",
          },
          geometry: {
            type: "Polygon",
            coordinates: [closedDraft],
          },
        });
      } else if (draftCoords.length >= 2) {
        features.push({
          type: "Feature",
          properties: {
            id: "draft-polygon-line",
            outlineColor: "#ff9500",
          },
          geometry: {
            type: "LineString",
            coordinates: draftCoords,
          },
        });
      }

      currentVerticesRef.current.forEach((pt, idx) => {
        handleFeatures.push({
          type: "Feature",
          properties: { index: idx },
          geometry: { type: "Point", coordinates: pt },
        });
      });
    }

    polySource.setData({ type: "FeatureCollection", features });
    handleSource.setData({
      type: "FeatureCollection",
      features: handleFeatures,
    });
  }, [map, initMapLayers]);

  const handleFinishPolygon = useCallback(() => {
    if (currentVerticesRef.current.length >= 3) {
      const vertices = [...currentVerticesRef.current];
      const areaSqM = calculatePolygonAreaSqM(vertices);
      const areaSqKm = parseFloat((areaSqM / 1_000_000).toFixed(3));

      const newPoly: PolygonItem = {
        ...initialPolygonState,
        id: `polygon-${Date.now()}`,
        name: `Polygon ${polyDataRef.current.length + 1}`,
        vertices,
        areaSqM: Math.round(areaSqM),
        areaSqKm,
      };

      if (afterDrawMode === "auto-save") {
        polyDataRef.current.push(newPoly);
        updateSourceData();
        onDrawEnd?.({
          id: newPoly.id,
          tool: "polygon",
          feature: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[...newPoly.vertices, newPoly.vertices[0]]],
            },
            properties: { id: newPoly.id, name: newPoly.name },
          },
          coordinates: newPoly.vertices,
          properties: { ...newPoly },
          metrics: { areaSqM: newPoly.areaSqM, areaSqKm: newPoly.areaSqKm },
        });
        toast.success(`Polygon created (${newPoly.areaSqKm} km²)`);
      } else {
        setPolyData(newPoly);
        setOpen(true);
      }

      currentVerticesRef.current = [];
      hoverLngLatRef.current = null;
      setIsPolyMode(false);
      setHasEnoughPoints(false);
      updateSourceData();
    } else {
      currentVerticesRef.current = [];
      hoverLngLatRef.current = null;
      setIsPolyMode(false);
      setHasEnoughPoints(false);
      updateSourceData();
    }
  }, [
    setIsPolyMode,
    updateSourceData,
    afterDrawMode,
    onDrawEnd,
  ]);

  useEffect(() => {
    isPolyModeRef.current = isPolyMode;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isPolyMode ? "crosshair" : "";
    }

    if (!isPolyMode) {
      currentVerticesRef.current = [];
      hoverLngLatRef.current = null;
      setHasEnoughPoints(false);
      updateSourceData();
    }
  }, [isPolyMode, map, updateSourceData]);

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      updateSourceData();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (!isPolyModeRef.current && map.getLayer("custom-poly-fill")) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["custom-poly-fill"],
        });
        if (features.length > 0) {
          e.preventDefault();
          const clickedId = features[0].properties?.id;
          const poly = polyDataRef.current.find((p) => p.id === clickedId);
          if (poly) {
            setPolyData(poly);
            setOpen(true);
          }
          return;
        }
      }

      if (isPolyModeRef.current) {
        const coord = [
          parseFloat(e.lngLat.lng.toFixed(5)),
          parseFloat(e.lngLat.lat.toFixed(5)),
        ];
        currentVerticesRef.current.push(coord);
        if (currentVerticesRef.current.length >= 3) {
          setHasEnoughPoints(true);
        }
        updateSourceData();
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isPolyModeRef.current || currentVerticesRef.current.length === 0) return;
      hoverLngLatRef.current = [e.lngLat.lng, e.lngLat.lat];
      updateSourceData();
    };

    const handleDblClick = (e: any) => {
      if (isPolyModeRef.current) {
        e.preventDefault();
        handleFinishPolygon();
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
  }, [map, initMapLayers, updateSourceData, handleFinishPolygon]);

  const handleSave = () => {
    const existingIndex = polyDataRef.current.findIndex(
      (p) => p.id === polyData.id
    );
    if (existingIndex >= 0) {
      polyDataRef.current[existingIndex] = polyData;
    } else {
      polyDataRef.current.push(polyData);
    }

    updateSourceData();

    onDrawEnd?.({
      id: polyData.id,
      tool: "polygon",
      feature: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...polyData.vertices, polyData.vertices[0]]],
        },
        properties: { id: polyData.id, name: polyData.name },
      },
      coordinates: polyData.vertices,
      properties: { ...polyData },
      metrics: { areaSqM: polyData.areaSqM, areaSqKm: polyData.areaSqKm },
    });

    setOpen(false);
    toast.success("Polygon saved");
  };

  const handleDelete = () => {
    polyDataRef.current = polyDataRef.current.filter((p) => p.id !== polyData.id);
    updateSourceData();
    onDrawDelete?.({ id: polyData.id, tool: "polygon" });
    setOpen(false);
    toast.info("Polygon deleted");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isPolyMode ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsPolyMode(!isPolyMode)}
        title={
          isPolyMode
            ? "Click points to outline polygon. Double click or checkmark to close"
            : "Draw Custom Polygon"
        }
      >
        <PolygonIcon size={18} />
      </button>

      {isPolyMode && hasEnoughPoints && (
        <button
          type="button"
          className="mlt-icon-btn"
          onClick={handleFinishPolygon}
          title="Complete Polygon"
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
        title={polyData.id ? "Edit Polygon" : "New Polygon"}
        footer={
          <div className="mlt-modal-footer">
            {polyDataRef.current.some((p) => p.id === polyData.id) && (
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
            value={polyData.name}
            onChange={(e) =>
              setPolyData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Zone A"
          />
        </div>

        {polyData.areaSqKm !== undefined && (
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb" }}>
            Calculated Area: {polyData.areaSqKm} km² ({polyData.areaSqM?.toLocaleString()} m²)
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
          <div className="mlt-form-group">
            <label className="mlt-label">Fill Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={polyData.fillColor}
              onChange={(e) =>
                setPolyData((prev) => ({ ...prev, fillColor: e.target.value }))
              }
            />
          </div>

          <div className="mlt-form-group">
            <label className="mlt-label">Outline Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={polyData.outlineColor}
              onChange={(e) =>
                setPolyData((prev) => ({ ...prev, outlineColor: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mlt-form-group">
          <label className="mlt-label">
            Fill Opacity ({polyData.fillOpacity}%)
          </label>
          <input
            type="range"
            className="mlt-slider"
            min={5}
            max={100}
            value={polyData.fillOpacity}
            onChange={(e) =>
              setPolyData((prev) => ({
                ...prev,
                fillOpacity: Number(e.target.value),
              }))
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
                      coordinates: [[...polyData.vertices, polyData.vertices[0]]],
                    },
                    properties: {
                      name: polyData.name,
                      areaSqKm: polyData.areaSqKm,
                    },
                  })
                );
                toast.success("Copied Polygon GeoJSON");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <CopyIcon size={13} /> Copy GeoJSON
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "polygon",
              coordinates: polyData.vertices,
              properties: { ...polyData },
              metrics: { areaSqM: polyData.areaSqM, areaSqKm: polyData.areaSqKm },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default DrawPolygonControl;
