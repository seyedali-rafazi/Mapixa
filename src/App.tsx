import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";
import { Toaster, toast } from "sonner";
import { Mapixa, MapAccordion, MapButton } from "./lib";
import type { DrawEndEvent, ExtraActionItem } from "./lib";
import { downloadGeoJSON, copyToClipboard } from "./lib";
import { Plane, Sparkles, Compass, MapPin } from "lucide-react";

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

  const [activeCustomTool, setActiveCustomTool] = useState<string | null>(null);

  const handleFlyToMiladTower = (_e: any, map?: any) => {
    if (!map) return;
    map.flyTo({
      center: [51.3753, 35.7448],
      zoom: 14,
      essential: true,
      duration: 2000,
    });
    toast.success("Navigating to Milad Tower", {
      description: "Latitude: 35.7448, Longitude: 51.3753",
    });
  };

  const handleFlyToAzadiTower = (_e: any, map?: any) => {
    if (!map) return;
    map.flyTo({
      center: [51.338, 35.6997],
      zoom: 14,
      essential: true,
      duration: 2000,
    });
    toast.success("Navigating to Azadi Tower", {
      description: "Latitude: 35.6997, Longitude: 51.3380",
    });
  };

  const handleToggleHighlight = () => {
    const next = activeCustomTool === "sparkles" ? null : "sparkles";
    setActiveCustomTool(next);
    if (next) {
      toast.info("Custom Highlight Mode Activated");
    } else {
      toast.info("Custom Highlight Mode Deactivated");
    }
  };

  const handleResetTehranCenter = (_e: any, map?: any) => {
    if (!map) return;
    map.flyTo({
      center: [51.389, 35.6892],
      zoom: 11,
      essential: true,
      duration: 1500,
    });
    toast.success("Reset view to Tehran Center");
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
        >
          {/* Custom Accordion in Toolbar containing Custom Buttons */}
          <MapAccordion
            title="CUSTOM"
            tooltip="Custom Tools & Landmarks"
            icon={<Sparkles size={18} />}
          >
            <MapButton
              icon={<Plane size={18} />}
              tooltip="Fly to Milad Tower"
              onClick={handleFlyToMiladTower}
            />
            <MapButton
              icon={<MapPin size={18} />}
              tooltip="Fly to Azadi Tower"
              onClick={handleFlyToAzadiTower}
            />
            <MapButton
              icon={<Sparkles size={18} />}
              tooltip="Toggle Custom Feature"
              active={activeCustomTool === "sparkles"}
              onClick={handleToggleHighlight}
              badge={activeCustomTool === "sparkles" ? "ON" : undefined}
            />
          </MapAccordion>

          {/* Standalone Custom Floating Button like Fullscreen Button */}
          <MapButton
            position="bottom-right"
            icon={<Compass size={18} />}
            tooltip="Center Tehran (Floating Custom Button)"
            onClick={handleResetTehranCenter}
          />
        </Mapixa>
      </Map>
    </div>
  );
}

export default App;
