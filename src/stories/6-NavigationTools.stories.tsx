import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import {
  MapNavigator,
  CoordinateDisplay,
  MapViewControl,
  MapControlBox,
  Mapixa,
} from "../lib";
import { MapStoryWrapper, SAMPLE_BASEMAPS } from "./MapStoryWrapper";

const meta: Meta = {
  title: "Navigation & Viewport/Controls",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Controls for navigating the map canvas: MapNavigator (Home, Compass, Zoom In/Out, Geolocation, Box Zoom), CoordinateDisplay (Live tracking + Point Picker mode), and MapViewControl (Fullscreen API).",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Standard MapNavigator panel with fly-to-home, reset bearing/north, zoom buttons, GPS locate, and box zoom.
 */
export const NavigatorPanel: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <MapControlBox position="top-left">
        <MapNavigator
          homeCenter={[51.389, 35.6892]}
          homeZoom={12}
          showBasemapSwitcher={true}
          basemapLayers={SAMPLE_BASEMAPS}
        />
      </MapControlBox>
    </MapStoryWrapper>
  ),
};

/**
 * Live cursor coordinate capsule with click-to-copy and interactive crosshair point picker mode.
 */
export const LiveCoordinateTrackerAndPicker: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <MapControlBox position="bottom-left">
        <CoordinateDisplay
          precision={6}
          onCopy={(coords) => {
            toast.success(`Copied: Lat ${coords.lat}, Lng ${coords.lng}`);
          }}
        />
      </MapControlBox>
    </MapStoryWrapper>
  ),
};

/**
 * Native browser Fullscreen toggle button synchronizing with Escape key and window changes.
 */
export const FullscreenControl: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <MapControlBox position="bottom-right">
        <MapViewControl />
      </MapControlBox>
    </MapStoryWrapper>
  ),
};

/**
 * All navigation controls mounted together without drawing toolbars.
 */
export const NavigationOnlySuite: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={false}
        showExtraTools={false}
        showNavigator={true}
        showCoordinates={true}
        showFullscreen={true}
        showBasemapSwitcher={true}
        basemapLayers={SAMPLE_BASEMAPS}
      />
    </MapStoryWrapper>
  ),
};
