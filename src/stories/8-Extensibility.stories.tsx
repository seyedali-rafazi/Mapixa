import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Mapixa, MapAccordion, MapButton } from "../lib";
import { MapStoryWrapper } from "./MapStoryWrapper";
import { Sparkles, Plane, Compass, Building2, Flame } from "lucide-react";

const meta: Meta = {
  title: "Extensibility/Custom Accordion & Buttons",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates how developers can extend Mapixa with custom GIS tools, POI landmark shortcuts, and state toggles using `<MapAccordion />` and `<MapButton />`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const CustomAccordionInToolbar: Story = {
  render: () => {
    const [activeMode, setActiveMode] = useState<string | null>(null);

    return (
      <MapStoryWrapper height="100vh">
        <Mapixa>
          {/* Custom Accordion injected into the main toolbar column */}
          <MapAccordion
            title="LANDMARKS"
            tooltip="Quick fly-to city landmarks"
            icon={<Building2 size={18} />}
          >
            <MapButton
              icon={<Plane size={18} />}
              tooltip="Fly to Airport"
              onClick={(_e, map) => {
                map?.flyTo({ center: [51.31, 35.68], zoom: 14, duration: 2000 });
                toast.success("Flying to International Airport");
              }}
            />
            <MapButton
              icon={<Sparkles size={18} />}
              tooltip="Toggle Heatmap Mode"
              active={activeMode === "heat"}
              badge="NEW"
              onClick={() => {
                const next = activeMode === "heat" ? null : "heat";
                setActiveMode(next);
                toast.info(`Heatmap mode ${next ? "enabled" : "disabled"}`);
              }}
            />
            <MapButton
              icon={<Flame size={18} />}
              tooltip="Fire Incidents"
              badge={3}
              onClick={() => {
                toast.warning("Displaying 3 active fire incident reports");
              }}
            />
          </MapAccordion>

          {/* Standalone floating custom button in bottom-right */}
          <MapButton
            position="bottom-right"
            icon={<Compass size={18} />}
            tooltip="Reset Camera to Center"
            onClick={(_e, map) => {
              map?.flyTo({ center: [51.389, 35.6892], zoom: 11, duration: 1500 });
              toast.success("Camera reset to Tehran City Center");
            }}
          />
        </Mapixa>
      </MapStoryWrapper>
    );
  },
};
