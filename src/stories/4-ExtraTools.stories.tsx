import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Mapixa, type DrawEndEvent } from "../lib";
import { MapStoryWrapper } from "./MapStoryWrapper";

const meta: Meta<typeof Mapixa> = {
  title: "Measurement & GIS Tools/Extra Tools Suite",
  component: Mapixa,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Extra Tools suite (`TOOL` accordion) contains measurement and GIS utilities: Multi-point Distance Ruler, Canvas Marquee Area Screenshot, Go-to Coordinates navigation, and Georeferenced Image Overlays.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Mapixa>;

const notifyMeasurement = (event: DrawEndEvent) => {
  toast.success(`Completed ${event.tool.toUpperCase()}`, {
    description: event.metrics?.distanceKm
      ? `Total Measured Distance: ${event.metrics.distanceKm} km`
      : undefined,
  });
};

/**
 * All measurement and utility tools enabled in the TOOL accordion.
 */
export const AllExtraTools: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={true}
        showNavigator={false}
        showCoordinates={true}
        onDrawEnd={notifyMeasurement}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Multi-point geodesic Distance Ruler tool with persistent on-map segment distance tags.
 */
export const DistanceRulerOnly: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={true}
        showNavigator={false}
        toolsConfig={{
          ruler: { visible: true },
          capture: { visible: false },
          goto: { visible: false },
          overlay: { visible: false },
        }}
        onDrawEnd={notifyMeasurement}
      />
    </MapStoryWrapper>
  ),
};

/**
 * High-resolution canvas bounding box capture and PNG export tool.
 */
export const AreaCaptureScreenshot: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={true}
        showNavigator={false}
        toolsConfig={{
          ruler: { visible: false },
          capture: { visible: true },
          goto: { visible: false },
          overlay: { visible: false },
        }}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Coordinate fly-to jumper with input validation and smooth camera animation.
 */
export const GoToCoordinates: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={true}
        showNavigator={false}
        toolsConfig={{
          ruler: { visible: false },
          capture: { visible: false },
          goto: { visible: true },
          overlay: { visible: false },
        }}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Georeferenced image overlay tool with repositioning, scale, rotation, and opacity sliders.
 */
export const GeoreferencedImageOverlay: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={true}
        showNavigator={false}
        toolsConfig={{
          ruler: { visible: false },
          capture: { visible: false },
          goto: { visible: false },
          overlay: { visible: true },
        }}
      />
    </MapStoryWrapper>
  ),
};
