import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { PinIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import Modal from "../ui/Modal";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { useDrawLayers } from "../../context/DrawLayersContext";
import { generateMarkerSvg } from "../../utils/generateMarkerSvg";
import { copyToClipboard } from "../../utils/exportUtils";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface MarkerItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  markerColor: string;
  iconType: "star" | "circle" | "square" | "pin";
  iconColor: string;
  size: number;
  opacity: number;
}

const initialMarkerState: MarkerItem = {
  id: "",
  name: "",
  lat: 35.6892,
  lon: 51.389,
  markerColor: "#ff3b30",
  iconType: "star",
  iconColor: "#ffffff",
  size: 38,
  opacity: 100,
};

export interface DrawMarkerControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const DrawMarkerControl: FC<DrawMarkerControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isDrawing, setIsDrawing] = useExclusiveTool("marker");
  const { onDrawEnd, onDrawDelete, afterDrawMode, extraActions: contextExtraActions } =
    useMapTool();
  const { isToolVisible } = useLayerVisibility();
  const { addDrawnLayer, removeDrawnLayer, drawnLayers, isEraserMode } = useDrawLayers();
  const isEraserModeRef = useRef(isEraserMode);
  isEraserModeRef.current = isEraserMode;

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [markerData, setMarkerData] = useState<MarkerItem>(initialMarkerState);

  const markersRef = useRef<MarkerItem[]>([]);
  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;
  const markerDataRef = useRef(markerData);
  markerDataRef.current = markerData;

  useEffect(() => {
    isDrawingRef.current = isDrawing;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isDrawing ? "crosshair" : "";
    }
  }, [isDrawing, map]);

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

    const currentFeatures = markersRef.current.map((m) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [m.lon, m.lat] },
      properties: {
        id: m.id,
        name: m.name,
        imageId: `marker-img-${m.id}`,
        markerColor: m.markerColor || "#ff3b30",
      },
    }));

    if (!map.getSource("custom-markers-source")) {
      map.addSource("custom-markers-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: currentFeatures as any },
      });
    }

    if (!map.getLayer("custom-markers-base-circle")) {
      map.addLayer({
        id: "custom-markers-base-circle",
        type: "circle",
        source: "custom-markers-source",
        layout: {
          visibility: isToolVisible("marker") ? "visible" : "none",
        },
        paint: {
          "circle-radius": 7,
          "circle-color": ["coalesce", ["get", "markerColor"], "#ff3b30"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    if (!map.getLayer("custom-markers-layer")) {
      map.addLayer({
        id: "custom-markers-layer",
        type: "symbol",
        source: "custom-markers-source",
        layout: {
          "icon-image": ["get", "imageId"],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-anchor": "bottom",
          "text-field": ["get", "name"],
          "text-offset": [0, 0.6],
          "text-anchor": "top",
          "text-size": 13,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          visibility: isToolVisible("marker") ? "visible" : "none",
        },
        paint: {
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
          "text-color": "#222222",
        },
      });
    }

    if (!map.getSource("draft-marker-source")) {
      map.addSource("draft-marker-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer("draft-marker-base-circle")) {
      map.addLayer({
        id: "draft-marker-base-circle",
        type: "circle",
        source: "draft-marker-source",
        paint: {
          "circle-radius": 8,
          "circle-color": ["coalesce", ["get", "markerColor"], "#ff3b30"],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    if (!map.getLayer("draft-marker-layer")) {
      map.addLayer({
        id: "draft-marker-layer",
        type: "symbol",
        source: "draft-marker-source",
        layout: {
          "icon-image": ["get", "imageId"],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-anchor": "bottom",
          "text-field": ["get", "name"],
          "text-offset": [0, 0.6],
          "text-anchor": "top",
          "text-size": 13,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
          "text-color": "#222222",
        },
      });
    }
  }, [map, isToolVisible, isMapReady]);

  const restoreMarkerImages = useCallback(() => {
    if (!map || markersRef.current.length === 0) return;

    markersRef.current.forEach((marker) => {
      const svgString = generateMarkerSvg(marker);
      const svgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        svgString
      )}`;
      const img = new Image(marker.size, marker.size);
      img.onload = () => {
        const imageId = `marker-img-${marker.id}`;
        if (map.hasImage(imageId)) map.removeImage(imageId);
        map.addImage(imageId, img);
      };
      img.src = svgDataUrl;
    });
  }, [map]);

  const updateGeojsonSource = useCallback(
    (currentMarkers: MarkerItem[]) => {
      if (!map) return;
      initMapLayers();

      const source = map.getSource("custom-markers-source") as any;
      if (!source) return;

      const geojsonData = {
        type: "FeatureCollection",
        features: currentMarkers.map((m) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [m.lon, m.lat] },
          properties: {
            id: m.id,
            name: m.name,
            imageId: `marker-img-${m.id}`,
            markerColor: m.markerColor || "#ff3b30",
          },
        })),
      };

      source.setData(geojsonData);
      try {
        map.triggerRepaint();
      } catch {
        // ignore
      }
    },
    [map, initMapLayers]
  );

  useEffect(() => {
    const currentMarkers = drawnLayers
      .filter((l) => l.tool === "marker")
      .map(
        (l) =>
          ({
            ...initialMarkerState,
            ...l.properties,
            id: l.id,
            name: l.name,
            lon: l.coordinates?.[0] ?? l.properties?.lon ?? 0,
            lat: l.coordinates?.[1] ?? l.properties?.lat ?? 0,
            markerColor: l.properties?.markerColor || l.properties?.color || "#ff3b30",
            iconType: l.properties?.iconType || "pin",
            iconColor: l.properties?.iconColor || "#ffffff",
            size: l.properties?.size || 38,
            opacity: l.properties?.opacity || 100,
          }) as MarkerItem
      );
    markersRef.current = currentMarkers;
    updateGeojsonSource(currentMarkers);
    restoreMarkerImages();
  }, [drawnLayers, updateGeojsonSource, restoreMarkerImages]);

  const updateDraftMarkerSource = useCallback(
    (draft?: MarkerItem | null) => {
      if (!map) return;
      initMapLayers();
      const source = map.getSource("draft-marker-source") as any;
      if (!source) return;

      if (draft) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [draft.lon, draft.lat] },
              properties: {
                id: draft.id,
                name: draft.name,
                imageId: `marker-img-${draft.id}`,
                markerColor: draft.markerColor || "#ff3b30",
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

  const saveMarkerImageToMap = useCallback(
    (marker: MarkerItem) => {
      if (!map) return;
      const svgString = generateMarkerSvg(marker);
      const svgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        svgString
      )}`;
      const img = new Image(marker.size, marker.size);
      img.onload = () => {
        const imageId = `marker-img-${marker.id}`;
        if (map.hasImage(imageId)) map.removeImage(imageId);
        map.addImage(imageId, img);
        try {
          map.triggerRepaint();
        } catch {
          // ignore
        }
        if (markersRef.current.some((m) => m.id === marker.id)) {
          updateGeojsonSource(markersRef.current);
        } else {
          updateDraftMarkerSource(marker);
        }
      };
      img.src = svgDataUrl;
    },
    [map, updateGeojsonSource, updateDraftMarkerSource]
  );

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      restoreMarkerImages();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (isEraserModeRef.current) return;

      if (!isDrawingRef.current && map.getLayer("custom-markers-layer")) {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["custom-markers-layer"],
        });
        if (features.length > 0) {
          e.preventDefault();
          const clickedId = features[0].properties?.id;
          const marker = markersRef.current.find((m) => m.id === clickedId);
          if (marker) {
            setMarkerData(marker);
            setOpen(true);
            saveMarkerImageToMap(marker);
            updateDraftMarkerSource(marker);
          }
          return;
        }
      }

      if (isDrawingRef.current) {
        const newMarker: MarkerItem = {
          ...initialMarkerState,
          id: `marker-${Date.now()}`,
          name: `Marker ${markersRef.current.length + 1}`,
          lat: parseFloat(e.lngLat.lat.toFixed(5)),
          lon: parseFloat(e.lngLat.lng.toFixed(5)),
        };

        if (afterDrawMode === "auto-save") {
          markersRef.current.push(newMarker);
          saveMarkerImageToMap(newMarker);
          addDrawnLayer({
            id: newMarker.id,
            name: newMarker.name,
            tool: "marker",
            visible: true,
            coordinates: [newMarker.lon, newMarker.lat],
            properties: { ...newMarker },
            feature: {
              type: "Feature",
              geometry: { type: "Point", coordinates: [newMarker.lon, newMarker.lat] },
              properties: { id: newMarker.id, name: newMarker.name },
            },
            createdAt: Date.now(),
          });
          onDrawEnd?.({
            id: newMarker.id,
            tool: "marker",
            feature: {
              type: "Feature",
              geometry: { type: "Point", coordinates: [newMarker.lon, newMarker.lat] },
              properties: { id: newMarker.id, name: newMarker.name },
            },
            coordinates: [newMarker.lon, newMarker.lat],
            properties: { ...newMarker },
          });
          toast.success("Marker added");
          setIsDrawing(false);
        } else {
          setMarkerData(newMarker);
          setOpen(true);
          setIsDrawing(false);
          saveMarkerImageToMap(newMarker);
          updateDraftMarkerSource(newMarker);
        }
      }
    };

    const handleMissingImage = (e: any) => {
      const id = e?.id;
      if (id && typeof id === "string" && id.startsWith("marker-img-")) {
        const markerId = id.replace("marker-img-", "");
        const targetMarker =
          markersRef.current.find((m) => m.id === markerId) ||
          (markerDataRef.current?.id === markerId ? markerDataRef.current : null);
        if (targetMarker && !map.hasImage(id)) {
          const svgString = generateMarkerSvg(targetMarker);
          const svgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
          const img = new Image(targetMarker.size, targetMarker.size);
          img.onload = () => {
            if (!map.hasImage(id)) map.addImage(id, img);
          };
          img.src = svgDataUrl;
        }
      }
    };

    map.on("styleimagemissing", handleMissingImage);
    map.on("click", handleMapClick);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("styleimagemissing", handleMissingImage);
      map.off("click", handleMapClick);
    };
  }, [
    map,
    initMapLayers,
    restoreMarkerImages,
    setIsDrawing,
    afterDrawMode,
    onDrawEnd,
    addDrawnLayer,
    saveMarkerImageToMap,
    updateDraftMarkerSource,
  ]);

  const handlePropertyChange = (updates: Partial<MarkerItem>) => {
    setMarkerData((prev) => {
      const next = { ...prev, ...updates };
      saveMarkerImageToMap(next);
      updateDraftMarkerSource(next);
      return next;
    });
  };

  const handleCloseModal = () => {
    updateDraftMarkerSource(null);
    setOpen(false);
  };

  const handleSave = () => {
    const existingIndex = markersRef.current.findIndex(
      (m) => m.id === markerData.id
    );
    if (existingIndex >= 0) {
      markersRef.current[existingIndex] = markerData;
    } else {
      markersRef.current.push(markerData);
    }

    saveMarkerImageToMap(markerData);
    updateDraftMarkerSource(null);
    updateGeojsonSource(markersRef.current);
    addDrawnLayer({
      id: markerData.id,
      name: markerData.name,
      tool: "marker",
      visible: true,
      coordinates: [markerData.lon, markerData.lat],
      properties: { ...markerData },
      feature: {
        type: "Feature",
        geometry: { type: "Point", coordinates: [markerData.lon, markerData.lat] },
        properties: { id: markerData.id, name: markerData.name },
      },
      createdAt: Date.now(),
    });

    onDrawEnd?.({
      id: markerData.id,
      tool: "marker",
      feature: {
        type: "Feature",
        geometry: { type: "Point", coordinates: [markerData.lon, markerData.lat] },
        properties: { id: markerData.id, name: markerData.name },
      },
      coordinates: [markerData.lon, markerData.lat],
      properties: { ...markerData },
    });

    setOpen(false);
    toast.success("Marker saved");
  };

  const handleDelete = () => {
    markersRef.current = markersRef.current.filter((m) => m.id !== markerData.id);
    if (map && map.hasImage(`marker-img-${markerData.id}`)) {
      map.removeImage(`marker-img-${markerData.id}`);
    }
    updateDraftMarkerSource(null);
    updateGeojsonSource(markersRef.current);
    removeDrawnLayer(markerData.id);
    onDrawDelete?.({ id: markerData.id, tool: "marker" });
    setOpen(false);
    toast.info("Marker removed");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isDrawing ? "mlt-icon-btn-active" : ""}`}
        title={isDrawing ? "Click on map to drop marker" : "Draw / Place Marker"}
        onClick={() => setIsDrawing(!isDrawing)}
      >
        <PinIcon size={18} />
      </button>

      <Modal
        open={open}
        onClose={handleCloseModal}
        title={markerData.id && markersRef.current.some((m) => m.id === markerData.id) ? "Edit Marker" : "New Marker"}
        footer={
          <div className="mlt-modal-footer">
            {markersRef.current.some((m) => m.id === markerData.id) && (
              <button
                type="button"
                className="mlt-btn mlt-btn-danger"
                onClick={handleDelete}
                style={{ marginRight: "auto" }}
              >
                <TrashIcon size={14} />
                <span>Delete</span>
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
            value={markerData.name}
            onChange={(e) => handlePropertyChange({ name: e.target.value })}
            placeholder="e.g. Landmark Pin"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div className="mlt-form-group">
            <label className="mlt-label">Latitude</label>
            <input
              type="number"
              step="any"
              className="mlt-input"
              value={markerData.lat}
              onChange={(e) =>
                handlePropertyChange({ lat: Number(e.target.value) })
              }
            />
          </div>
          <div className="mlt-form-group">
            <label className="mlt-label">Longitude</label>
            <input
              type="number"
              step="any"
              className="mlt-input"
              value={markerData.lon}
              onChange={(e) =>
                handlePropertyChange({ lon: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div className="mlt-form-group">
            <label className="mlt-label">Pin Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={markerData.markerColor}
              onChange={(e) =>
                handlePropertyChange({ markerColor: e.target.value })
              }
            />
          </div>
          <div className="mlt-form-group">
            <label className="mlt-label">Symbol Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={markerData.iconColor}
              onChange={(e) =>
                handlePropertyChange({ iconColor: e.target.value })
              }
            />
          </div>
        </div>

        <div className="mlt-form-group">
          <label className="mlt-label">Symbol Icon</label>
          <select
            className="mlt-select"
            value={markerData.iconType}
            onChange={(e) =>
              handlePropertyChange({ iconType: e.target.value as any })
            }
          >
            <option value="star">Star</option>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="pin">Simple Pin</option>
          </select>
        </div>

        <div className="mlt-form-group">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label className="mlt-label">Size ({markerData.size}px)</label>
          </div>
          <input
            type="range"
            className="mlt-slider"
            min={24}
            max={64}
            value={markerData.size}
            onChange={(e) =>
              handlePropertyChange({ size: Number(e.target.value) })
            }
          />
        </div>

        {/* Extra Action Buttons Section */}
        <div style={{ marginTop: "6px", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#86868b", marginBottom: "6px" }}>
            Quick Actions:
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="mlt-btn mlt-btn-sm mlt-btn-outlined"
              onClick={() => {
                copyToClipboard(
                  JSON.stringify({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [markerData.lon, markerData.lat],
                    },
                    properties: { name: markerData.name },
                  })
                );
                toast.success("Copied GeoJSON to clipboard");
              }}
            >
              <CopyIcon size={14} />
              <span>Copy GeoJSON</span>
            </button>
          </div>

          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "marker",
              coordinates: [markerData.lon, markerData.lat],
              properties: { ...markerData },
              map,
              closeModal: () => setOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default DrawMarkerControl;
