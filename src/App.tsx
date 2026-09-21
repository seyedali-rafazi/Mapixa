import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";
import { Toaster, toast } from "sonner";
import { Mapixa } from "./lib";
import type { DrawEndEvent, ExtraActionItem } from "./lib";
import { downloadGeoJSON, copyToClipboard } from "./lib";

export function App() {
  // Extensible custom actions available inside tool modals after drawing
  const extraActions: ExtraActionItem[] = [
    {
      id: "save-api",
      label: "Save to API",
      variant: "contained",
      color: "primary",
      onClick: ({ tool, feature, metrics, closeModal }) => {
        toast.success(`Saved ${tool} to backend!`, {
          description: metrics?.areaSqKm
            ? `Area: ${metrics.areaSqKm} km²`
            : metrics?.distanceKm
              ? `Distance: ${metrics.distanceKm} km`
              : undefined,
        });
        closeModal?.();
      },
    },
    {
      id: "download-geojson",
      label: "Export GeoJSON",
      variant: "outlined",
      onClick: ({ tool, feature }) => {
        downloadGeoJSON(feature, `${tool}-${Date.now()}.geojson`);
        toast.success("Downloaded GeoJSON file");
      },
    },
    {
      id: "copy-coords",
      label: "Copy Coords",
      variant: "text",
      onClick: ({ coordinates }) => {
        copyToClipboard(JSON.stringify(coordinates));
        toast.success("Coordinates copied to clipboard");
      },
    },
  ];

  const handleDrawEnd = (event: DrawEndEvent) => {
    console.log("After draw happened:", event);
    const metricText = event.metrics?.areaSqKm
      ? ` (${event.metrics.areaSqKm} km²)`
      : event.metrics?.distanceKm
        ? ` (${event.metrics.distanceKm} km)`
        : "";

    toast.success(`Drew ${event.tool.toUpperCase()}${metricText}`, {
      description: `ID: ${event.id}`,
    });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Toaster position="top-center" richColors />

      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 51.389,
          latitude: 35.6892,
          zoom: 11,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        <Mapixa
          afterDrawMode="modal"
          extraActions={extraActions}
          onDrawEnd={handleDrawEnd}
          visibility={{ polyine: true, circle: false }}
          color="#000"
        />
      </Map>
    </div>
  );
}

export default App;
