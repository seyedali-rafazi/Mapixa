import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { PinIcon, TrashIcon, CopyIcon } from "../ui/Icons";
import Modal from "../ui/Modal";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
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

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const [open, setOpen] = useState(false);
  const [markerData, setMarkerData] = useState<MarkerItem>(initialMarkerState);

  const markersRef = useRef<MarkerItem[]>([]);
  const isDrawingRef = useRef(isDrawing);

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  useEffect(() => {
    isDrawingRef.current = isDrawing;
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = isDrawing ? "crosshair" : "";
    }
  }, [isDrawing, map]);

  const initMapLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    const currentFeatures = markersRef.current.map((m) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [m.lon, m.lat] },
      properties: { id: m.id, name: m.name, imageId: `marker-img-${m.id}` },
    }));

    if (!map.getSource("custom-markers-source")) {
      map.addSource("custom-markers-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: currentFeatures as any },
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
          "icon-anchor": "bottom",
          "text-field": ["get", "name"],
          "text-offset": [0, 0.6],
          "text-anchor": "top",
          "text-size": 13,
          visibility: isToolVisible("marker") ? "visible" : "none",
        },
        paint: {
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
          "text-color": "#222222",
        },
      });
    }
  }, [map, isToolVisible]);

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
          properties: { id: m.id, name: m.name, imageId: `marker-img-${m.id}` },
        })),
      };

      source.setData(geojsonData);
    },
    [map, initMapLayers]
  );

  const saveMarkerImageToMap = (marker: MarkerItem) => {
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
      updateGeojsonSource(markersRef.current);
    };
    img.src = svgDataUrl;
  };

  useEffect(() => {
    if (!map) return;

    const onStyleLoad = () => {
      initMapLayers();
      restoreMarkerImages();
    };

    if (map.isStyleLoaded()) initMapLayers();
    map.on("style.load", onStyleLoad);

    const handleMapClick = (e: any) => {
      if (map.getLayer("custom-markers-layer")) {
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
        }
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("click", handleMapClick);
    };
  }, [map, initMapLayers, restoreMarkerImages, setIsDrawing, afterDrawMode, onDrawEnd]);

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
    updateGeojsonSource(markersRef.current);
    onDrawDelete?.({ id: markerData.id, tool: "marker" });
    setOpen(false);
    toast.info("Marker removed");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isDrawing ? "active" : ""}`}
        title={isDrawing ? "Click on map to drop marker" : "Draw / Place Marker"}
        onClick={() => setIsDrawing(!isDrawing)}
      >
        <PinIcon size={18} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={markerData.id ? "Edit Marker" : "New Marker"}
        footer={
          <>
            {markersRef.current.some((m) => m.id === markerData.id) && (
              <button
                type="button"
                className="mlt-btn mlt-btn-danger"
                onClick={handleDelete}
                style={{ marginRight: "auto" }}
              >
                <TrashIcon size={16} />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              className="mlt-btn mlt-btn-outlined"
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
          </>
        }
      >
        <div className="mlt-form-group">
          <label className="mlt-form-label">Name / Label</label>
          <input
            type="text"
            className="mlt-input"
            value={markerData.name}
            onChange={(e) =>
              setMarkerData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div className="mlt-form-group" style={{ flex: 1 }}>
            <label className="mlt-form-label">Latitude</label>
            <input
              type="number"
              step="any"
              className="mlt-input"
              value={markerData.lat}
              onChange={(e) =>
                setMarkerData((prev) => ({ ...prev, lat: Number(e.target.value) }))
              }
            />
          </div>
          <div className="mlt-form-group" style={{ flex: 1 }}>
            <label className="mlt-form-label">Longitude</label>
            <input
              type="number"
              step="any"
              className="mlt-input"
              value={markerData.lon}
              onChange={(e) =>
                setMarkerData((prev) => ({ ...prev, lon: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div className="mlt-form-group" style={{ flex: 1 }}>
            <label className="mlt-form-label">Pin Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={markerData.markerColor}
              onChange={(e) =>
                setMarkerData((prev) => ({ ...prev, markerColor: e.target.value }))
              }
            />
          </div>
          <div className="mlt-form-group" style={{ flex: 1 }}>
            <label className="mlt-form-label">Symbol Color</label>
            <input
              type="color"
              className="mlt-color-picker"
              value={markerData.iconColor}
              onChange={(e) =>
                setMarkerData((prev) => ({ ...prev, iconColor: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mlt-form-group">
          <label className="mlt-form-label">Symbol Icon</label>
          <select
            className="mlt-select"
            value={markerData.iconType}
            onChange={(e) =>
              setMarkerData((prev) => ({
                ...prev,
                iconType: e.target.value as any,
              }))
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
            <label className="mlt-form-label">Size</label>
            <span style={{ fontSize: "0.75rem", color: "#86868b" }}>
              {markerData.size}px
            </span>
          </div>
          <input
            type="range"
            className="mlt-slider"
            min={24}
            max={64}
            value={markerData.size}
            onChange={(e) =>
              setMarkerData((prev) => ({ ...prev, size: Number(e.target.value) }))
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
