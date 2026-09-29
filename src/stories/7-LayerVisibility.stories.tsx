import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Mapixa, MapControlBox, LayerVisibilityControl } from "../lib";
import { MapStoryWrapper } from "./MapStoryWrapper";

const meta: Meta = {
  title: "Layer Visibility/Controls",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Layer Visibility System allows instant toggling of individual feature categories (markers, polylines, polygons, circles, rectangles, freehand sketches, rulers, overlays) or collectively via master Show/Hide without deleting the underlying GeoJSON data.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Controlled initial visibility state where circles and freehand sketches are hidden by default.
 */
export const ControlledVisibility: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        visibility={{
          marker: true,
          line: true,
          polygon: true,
          circle: false,
          rectangle: true,
          freedraw: false,
          ruler: true,
          overlay: true,
        }}
        onVisibilityChange={(tool, visible) => {
          toast.info(`Layer "${tool}" is now ${visible ? "visible" : "hidden"}`);
        }}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Standalone floating LayerVisibilityControl mounted inside an isolated corner box.
 */
export const StandaloneFloatingControl: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa showDrawTools={false} showExtraTools={false} showNavigator={false}>
        <MapControlBox position="top-right">
          <LayerVisibilityControl />
        </MapControlBox>
      </Mapixa>
    </MapStoryWrapper>
  ),
};
