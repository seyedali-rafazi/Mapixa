import type { Preview } from "@storybook/react-vite";
import "maplibre-gl/dist/maplibre-gl.css";
import "../src/lib/styles/map-tools.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;