import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Mapixa, type DrawEndEvent } from "../lib";
import { MapStoryWrapper } from "./MapStoryWrapper";

const meta: Meta<typeof Mapixa> = {
  title: "Drawing Suite/Tools & Controls",
  component: Mapixa,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates the vector drawing capabilities of Mapixa: Markers, Polylines, Polygons, Circles, Rectangles, Freehand Sketching, Intersection Detection, and Shape Eraser.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Mapixa>;

const notifyDraw = (event: DrawEndEvent) => {
  toast.success(`Created ${event.tool.toUpperCase()}`, {
    description: event.metrics?.areaSqKm
      ? `Area: ${event.metrics.areaSqKm} km²`
      : event.metrics?.distanceKm
        ? `Distance: ${event.metrics.distanceKm} km`
        : `Coordinates: ${JSON.stringify(event.coordinates).slice(0, 30)}...`,
  });
};

/**
 * The standard Draw Tools accordion containing all vector creation, eraser, and layer management tools.
 */
export const AllDrawingTools: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        showCoordinates={true}
        showFullscreen={false}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Isolated Marker Pin tool with customization dialog (icon glyphs, colors, sizes, and labels).
 */
export const MarkerToolOnly: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        toolsConfig={{
          marker: { visible: true },
          line: { visible: false },
          polygon: { visible: false },
          circle: { visible: false },
          rectangle: { visible: false },
          freedraw: { visible: false },
          intersection: { visible: false },
          erase: { visible: false },
          layerManager: { visible: true },
        }}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Line, Polygon, and Rectangle tools for drafting infrastructure, boundaries, and zones.
 */
export const LinesAndPolygons: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        toolsConfig={{
          marker: { visible: false },
          line: { visible: true },
          polygon: { visible: true },
          circle: { visible: false },
          rectangle: { visible: true },
          freedraw: { visible: false },
          intersection: { visible: false },
          erase: { visible: true },
          layerManager: { visible: true },
        }}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Geodesic circle generator with real-time radius expansion and spherical area preview.
 */
export const GeodesicCircles: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        toolsConfig={{
          marker: { visible: false },
          line: { visible: false },
          polygon: { visible: false },
          circle: { visible: true },
          rectangle: { visible: false },
          freedraw: { visible: false },
          intersection: { visible: false },
          erase: { visible: true },
          layerManager: { visible: true },
        }}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Freehand drawing pen tool with smooth mouse coordinate streaming and popover brush settings.
 */
export const FreehandDrawing: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        toolsConfig={{
          marker: { visible: false },
          line: { visible: false },
          polygon: { visible: false },
          circle: { visible: false },
          rectangle: { visible: false },
          freedraw: { visible: true },
          intersection: { visible: false },
          erase: { visible: true },
          layerManager: { visible: true },
        }}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Line Intersection detector: draw two crossing lines to automatically calculate crossing coordinates.
 */
export const LineIntersectionDetector: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        toolsConfig={{
          marker: { visible: false },
          line: { visible: false },
          polygon: { visible: false },
          circle: { visible: false },
          rectangle: { visible: false },
          freedraw: { visible: false },
          intersection: { visible: true },
          erase: { visible: true },
          layerManager: { visible: true },
        }}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};

/**
 * Shape Eraser mode: click any shape on the map canvas to immediately remove it.
 */
export const InteractiveShapeEraser: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
        toolsConfig={{
          marker: { visible: true },
          line: { visible: true },
          polygon: { visible: true },
          circle: { visible: true },
          erase: { visible: true },
          layerManager: { visible: true },
        }}
        onDrawEnd={notifyDraw}
      />
    </MapStoryWrapper>
  ),
};
