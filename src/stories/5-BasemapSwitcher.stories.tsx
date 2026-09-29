import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import {
  BasemapSwitcher,
  Mapixa,
  MapAccordion,
  type BasemapLayerItem,
} from "../lib";
import {
  MapStoryWrapper,
  SAMPLE_BASEMAPS,
  SAMPLE_OVERLAYS,
} from "./MapStoryWrapper";
import { Layers } from "lucide-react";

const meta: Meta<typeof BasemapSwitcher> = {
  title: "Basemap & Overlays/Basemap Switcher",
  component: BasemapSwitcher,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Basemap Switcher allows users to swap vector and raster map styles (Dark, Light, Voyager, OSM) and toggle transparent overlays (marine seamarks, traffic grid) with custom opacity.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BasemapSwitcher>;

/**
 * Standalone floating BasemapSwitcher positioned at top-left.
 */
export const StandaloneFloating: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <BasemapSwitcher
        position="top-left"
        layers={SAMPLE_BASEMAPS}
        overlays={SAMPLE_OVERLAYS}
        onLayerChange={(layer: BasemapLayerItem) => {
          toast.success(`Switched base style: ${layer.name}`);
        }}
        onOverlayChange={(activeIds: string[]) => {
          toast.info(`Active overlays: ${activeIds.join(", ") || "None"}`);
        }}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Embedded seamlessly inside the Navigator panel (`showBasemapSwitcher={true}`).
 */
export const EmbeddedInNavigator: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={false}
        showNavigator={true}
        showBasemapSwitcher={true}
        basemapLayers={SAMPLE_BASEMAPS}
        basemapOverlays={SAMPLE_OVERLAYS}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Embedded inside a custom accordion toolbar with custom title and icon.
 */
export const InsideCustomAccordion: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={false}
        showNavigator={false}
      >
        <MapAccordion
          title="MAP STYLES"
          icon={<Layers size={18} />}
          tooltip="Select Base Map & Overlays"
        >
          <BasemapSwitcher
            layer={SAMPLE_BASEMAPS}
            overlay={SAMPLE_OVERLAYS}
            tooltip="Choose Basemap"
          />
        </MapAccordion>
      </Mapixa>
    </MapStoryWrapper>
  ),
};
