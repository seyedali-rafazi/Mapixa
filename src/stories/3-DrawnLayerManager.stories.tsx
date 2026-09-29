import { useEffect, type FC } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Mapixa, useDrawLayers, type DrawnLayerItem } from "../lib";
import { MapStoryWrapper } from "./MapStoryWrapper";

const meta: Meta<typeof Mapixa> = {
  title: "Drawing Suite/Drawn Layer Manager",
  component: Mapixa,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Drawn Layer Manager popover acts as the central hub for all drawn shapes. It provides shape-specific badges, inline label editing, individual & master visibility toggling, camera locate / zoom-to-feature, drag-and-drop layer reordering (controlling visual map z-index), and batch clear.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Mapixa>;

// Helper component that preloads sample shapes onto the canvas
const SampleShapesLoader: FC = () => {
  const { addDrawnLayer, drawnLayers } = useDrawLayers();

  useEffect(() => {
    if (drawnLayers.length > 0) return;

    const sampleMarker: DrawnLayerItem = {
      id: "sample-marker-1",
      name: "City Center Station",
      tool: "marker",
      visible: true,
      createdAt: Date.now() - 30000,
      properties: {
        markerColor: "#007aff",
        iconType: "pin",
        iconColor: "#ffffff",
        size: 38,
      },
      feature: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [51.389, 35.6892],
        },
        properties: {},
      },
      coordinates: [51.389, 35.6892],
    };

    const samplePolygon: DrawnLayerItem = {
      id: "sample-poly-1",
      name: "Central Park Zone",
      tool: "polygon",
      visible: true,
      createdAt: Date.now() - 20000,
      properties: {
        fillColor: "#34c759",
        fillOpacity: 0.4,
        outlineColor: "#248a3d",
      },
      feature: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [51.37, 35.68],
              [51.41, 35.68],
              [51.41, 35.70],
              [51.37, 35.70],
              [51.37, 35.68],
            ],
          ],
        },
        properties: {},
      },
      metrics: {
        areaSqKm: 6.84,
      },
    };

    const sampleLine: DrawnLayerItem = {
      id: "sample-line-1",
      name: "Metro Transit Corridor",
      tool: "line",
      visible: true,
      createdAt: Date.now() - 10000,
      properties: {
        strokeColor: "#ff9500",
        strokeWidth: 4,
      },
      feature: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [51.35, 35.67],
            [51.39, 35.70],
            [51.43, 35.72],
          ],
        },
        properties: {},
      },
      metrics: {
        distanceKm: 11.2,
      },
    };

    addDrawnLayer(sampleMarker);
    addDrawnLayer(samplePolygon);
    addDrawnLayer(sampleLine);

    toast.info("Pre-loaded 3 sample layers (Marker, Polygon, Line)", {
      description: "Click the Layers Manager icon in the Draw toolbar to inspect.",
    });
  }, [addDrawnLayer, drawnLayers.length]);

  return null;
};

/**
 * Pre-populated Layer Manager demonstrating live badge count, layer list, locate, rename, and reorder.
 */
export const PrePopulatedLayers: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={false}
      >
        <SampleShapesLoader />
      </Mapixa>
    </MapStoryWrapper>
  ),
};

/**
 * Interactive blank canvas ready for the user to draw shapes and observe the manager's real-time count updates.
 */
export const InteractiveDrawAndManage: Story = {
  render: () => (
    <MapStoryWrapper height="100vh">
      <Mapixa
        showDrawTools={true}
        showExtraTools={false}
        showNavigator={true}
        onDrawEnd={(e) => {
          toast.success(`Added ${e.tool} to Layer Manager`);
        }}
      />
    </MapStoryWrapper>
  ),
};
