import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import {
  Mapixa,
  downloadGeoJSON,
  copyToClipboard,
  type DrawEndEvent,
  type ExtraActionItem,
} from "../lib";
import {
  MapStoryWrapper,
  SAMPLE_BASEMAPS,
  SAMPLE_OVERLAYS,
} from "./MapStoryWrapper";

const meta: Meta<typeof Mapixa> = {
  title: "Core/Mapixa (All-in-One)",
  component: Mapixa,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The complete `<Mapixa />` suite mounting Drawing Tools, Extra GIS Tools, Navigator, Basemap Switcher, Live Coordinates, and Fullscreen toggle in one component.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Mapixa>;

const customActions: ExtraActionItem[] = [
  {
    id: "save-api",
    label: "Save to API",
    variant: "contained",
    color: "primary",
    onClick: ({ tool, feature, metrics, closeModal }) => {
      toast.success(`Saved ${tool} to backend API!`, {
        description: metrics?.areaSqKm
          ? `Area: ${metrics.areaSqKm} km²`
          : metrics?.distanceKm
            ? `Distance: ${metrics.distanceKm} km`
            : "Feature saved successfully",
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
  const metricText = event.metrics?.areaSqKm
    ? ` (${event.metrics.areaSqKm} km²)`
    : event.metrics?.distanceKm
      ? ` (${event.metrics.distanceKm} km)`
      : "";
  toast.success(`Finished drawing ${event.tool.toUpperCase()}${metricText}`, {
    description: `Shape ID: ${event.id}`,
  });
};

/**
 * Standard complete Mapixa setup with light theme cartography.
 */
export const Default: Story = {
  render: (args) => (
    <MapStoryWrapper theme="light" height="100vh">
      <Mapixa
        {...args}
        showBasemapSwitcher={true}
        basemapLayers={SAMPLE_BASEMAPS}
        basemapOverlays={SAMPLE_OVERLAYS}
        onDrawEnd={handleDrawEnd}
      />
    </MapStoryWrapper>
  ),
  args: {
    toolbarPosition: "top-right",
    navigatorPosition: "top-left",
    coordinatePosition: "bottom-left",
    viewControlPosition: "bottom-right",
    toolbarGap: 12,
    afterDrawMode: "modal",
  },
};

/**
 * Sleek Dark Mode with high-contrast cartography and `#1e1e1e` glassmorphic chrome.
 */
export const DarkTheme: Story = {
  render: (args) => (
    <MapStoryWrapper theme="dark" height="100vh">
      <Mapixa
        {...args}
        color="#1e1e1e"
        showBasemapSwitcher={true}
        basemapLayers={SAMPLE_BASEMAPS}
        onDrawEnd={handleDrawEnd}
      />
    </MapStoryWrapper>
  ),
  args: {
    toolbarPosition: "top-right",
    navigatorPosition: "top-left",
    coordinatePosition: "bottom-left",
    viewControlPosition: "bottom-right",
    afterDrawMode: "modal",
  },
};

/**
 * Auto-save mode immediately commits shapes to the canvas and fires `onDrawEnd` without opening a configuration modal.
 */
export const AutoSaveMode: Story = {
  render: (args) => (
    <MapStoryWrapper theme="light" height="100vh">
      <Mapixa
        {...args}
        afterDrawMode="auto-save"
        onDrawEnd={handleDrawEnd}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Injected custom actions inside the after-draw modal dialog ("Save to API", "Export GeoJSON", "Copy Coords").
 */
export const WithCustomActions: Story = {
  render: (args) => (
    <MapStoryWrapper theme="light" height="100vh">
      <Mapixa
        {...args}
        extraActions={customActions}
        onDrawEnd={handleDrawEnd}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Fully customizable control corner positioning.
 */
export const CustomCornerPositions: Story = {
  render: (args) => (
    <MapStoryWrapper theme="voyager" height="100vh">
      <Mapixa
        {...args}
        toolbarPosition="bottom-left"
        navigatorPosition="top-right"
        coordinatePosition="top-left"
        viewControlPosition="bottom-right"
        onDrawEnd={handleDrawEnd}
      />
    </MapStoryWrapper>
  ),
};
