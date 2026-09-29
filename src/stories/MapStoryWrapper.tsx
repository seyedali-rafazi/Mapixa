import { type FC, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";
import { Toaster } from "sonner";
import type { BasemapLayerItem, BasemapOverlayItem } from "../lib";

export const SAMPLE_BASEMAPS: BasemapLayerItem[] = [
  {
    id: "light",
    name: "Light Map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    description: "Clean minimalist light cartography",
  },
  {
    id: "dark",
    name: "Dark Map",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    description: "High-contrast dark cartography",
  },
  {
    id: "voyager",
    name: "Voyager",
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    description: "Vibrant exploration map style",
  },
  {
    id: "demotiles",
    name: "MapLibre Demo",
    style: "https://demotiles.maplibre.org/style.json",
    description: "Official vector tiles demo",
  },
];

export const SAMPLE_OVERLAYS: BasemapOverlayItem[] = [
  {
    id: "traffic-osm",
    name: "Traffic & Road Grid",
    style: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    description: "Street network and transit overlay",
    opacity: 0.65,
  },
  {
    id: "seamarks",
    name: "OpenSeaMap Marine",
    style: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
    description: "Navigational aids, beacons, and sea marks",
    opacity: 0.85,
  },
];

export interface MapStoryWrapperProps {
  children?: ReactNode;
  theme?: "light" | "dark" | "voyager";
  height?: string | number;
  initialCenter?: [number, number];
  initialZoom?: number;
  interactive?: boolean;
}

export const MapStoryWrapper: FC<MapStoryWrapperProps> = ({
  children,
  theme = "light",
  height = "600px",
  initialCenter = [51.389, 35.6892],
  initialZoom = 12,
  interactive = true,
}) => {
  const mapStyle =
    theme === "dark"
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : theme === "voyager"
        ? "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  return (
    <div
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <Toaster position="top-center" richColors />
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: initialCenter[0],
          latitude: initialCenter[1],
          zoom: initialZoom,
        }}
        mapStyle={mapStyle}
        interactive={interactive}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </Map>
    </div>
  );
};

export default MapStoryWrapper;
