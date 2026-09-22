import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";
import { Toaster, toast } from "sonner";
import {
  Mapixa,
  MapAccordion,
  MapButton,
  BasemapSwitcher,
  type BasemapLayerItem,
  type BasemapOverlayItem,
} from "./lib";
import type { DrawEndEvent, ExtraActionItem } from "./lib";
import { downloadGeoJSON, copyToClipboard } from "./lib";
import { Plane, Sparkles, Compass, MapPin } from "lucide-react";

export function App() {
  const basemapLayers: BasemapLayerItem[] = [
    {
      id: "dark",
      name: "Dark Map",
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      description: "High-contrast dark cartography",
    },
    {
      id: "light",
      name: "Light Map",
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      description: "Clean minimalist light map",
    },
    {
      id: "voyager",
      name: "Voyager",
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      description: "Detailed colorful exploration style",
    },
    {
      id: "demotiles",
      name: "MapLibre Demo",
      style: "https://demotiles.maplibre.org/style.json",
      description: "Official MapLibre demo vector tiles",
    },
  ];

  const basemapOverlays: BasemapOverlayItem[] = [
    {
      id: "traffic-osm",
      name: "Traffic & Road Grid",
      style: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      description: "High-contrast street and transit overlay",
      opacity: 0.65,
    },
    {
      id: "seamarks",
      name: "OpenSeaMap Marine Marks",
      style: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
      description: "Beacons, buoys, and marine routes",
      opacity: 0.85,
    },
  ];

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
          // Mode 1: Integrated into the Navigation Section (Top-Left)
          showBasemapSwitcher={true}
          basemapLayers={basemapLayers}
          basemapOverlays={basemapOverlays}
        >
          {/* Custom Accordion in Toolbar containing Custom Buttons + Mode 2: BasemapSwitcher in Accordion */}
          <MapAccordion
            title="CUSTOM"
            tooltip="Custom Tools & Landmarks"
            icon={<Sparkles size={18} />}
          >
            {/* Mode 2: User can implement as custom button in other accordion */}
            <BasemapSwitcher
              layer={basemapLayers}
              overlay={basemapOverlays}
              tooltip="Basemap & Overlays (In Accordion)"
            />
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

          {/* Mode 3: User can implement as single button like fullscreen */}
          <BasemapSwitcher
            position="bottom-right"
            layer={basemapLayers}
            overlay={basemapOverlays}
            tooltip="Basemap & Overlays (Standalone Button)"
          />

          {/* Standalone Custom Floating Button */}
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
