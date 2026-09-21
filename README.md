# 🗺️ Mapixa

> A feature-rich, extensible suite of drawing, measurement, navigation, and layer visibility tools for **MapLibre GL JS** and **React**. Built with pure CSS, vanilla JavaScript, and Lucide icons.

[![npm version](https://img.shields.io/npm/v/mapixa.svg?style=flat-square)](https://www.npmjs.com/package/mapixa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 📍 **Full Draw Suite**:
  - **Markers**: Custom SVG pins (star, circle, square, classic pin), customizable color, size, opacity, and label.
  - **Polylines**: Live drafting line, double-click or finish button, custom width, color, and real-time distance calculation.
  - **Polygons**: Interactive vertex handles, live perimeter drafting, and real-time spherical area calculation ($m^2$ and $km^2$).
  - **Circles**: Center-point & radius drafting, calculated area, and 64-vertex GeoJSON Polygon generation.
  - **Rectangles**: Two-point bounding box dragging with live area metrics.
  - **Freehand Pen**: Smooth freehand brush sketching with configurable stroke width and color.
  - **Intersections**: Segment intersection detector that flags and computes coordinates of line crossings.
- 📐 **Measurement & Utilities**:
  - **Distance Ruler**: Segment distances and total distance calculation in kilometers.
  - **Area Capture**: Drag-to-select map canvas crop and high-resolution PNG export.
  - **GoTo Coordinates**: Smooth fly-to navigation with coordinate validation (DD/DMS).
  - **Image Overlays**: Place, drag, scale, rotate, and adjust opacity of custom image overlays on map coordinates.
- 👁️ **Layer Visibility System**:
  - Toggle visibility for all markers, lines, polygons, circles, rectangles, freehand sketches, rulers, and overlays.
  - Programmatic control via `useLayerVisibility()` and controlled `visibility` prop on the root component.
- ⚡ **"After Draw" Action Lifecycle**:
  - `onDrawEnd` event fired whenever any drawing completes, providing the complete GeoJSON feature and calculated metrics.
  - Multiple modes: `'modal'` (styling modal), `'auto-save'` (silent commit), or `'callback'`.
  - Inject custom action buttons (`extraActions`) into tool dialogs (e.g., _Save to Cloud API_, _Buffer 500m_, _Download GeoJSON_, _Export KML_).
- 🧭 **Navigation Controls**:
  - Reset View (Home), Zoom In/Out, Locate User (GPS), Box Zoom (Shift + Drag), Reset North (Compass).
  - **Live Coordinate Display**: Cursor hover coordinates with click-to-copy to clipboard.
- 🎨 **Pure CSS & Zero Framework Bloat**:
  - No Material UI, No Emotion, No Tailwind requirement.
  - Modern glassmorphic floating UI with buttery-smooth CSS Grid accordion animations.
  - Powered by **lucide-react** icons.

---

## 📦 Installation

```bash
npm install mapixa maplibre-gl react-map-gl
```

_or with yarn:_

```bash
yarn add mapixa maplibre-gl react-map-gl
```

_or with pnpm:_

```bash
pnpm add mapixa maplibre-gl react-map-gl
```

---

## 🚀 Quick Start

Wrap your application with MapLibre and mount `<Mapixa />` (or `<MapLibreTools />`) directly inside:

```tsx
import React from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapixa/style.css";
import maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";
import { Mapixa } from "mapixa";

export function MyMap() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 51.389,
          latitude: 35.6892,
          zoom: 12,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Mount all tools in one line */}
        <Mapixa
          afterDrawMode="modal"
          onDrawEnd={(event) => {
            console.log("After draw happened:", event.tool, event.feature);
          }}
          visibility={{ polyine: true, circle: false }}
          toolbarGap={12}
        />
      </Map>
    </div>
  );
}
```

---

## ⚡ Handling "After Draw" Actions

You can customize what happens after the user completes a drawing:

### 1. `onDrawEnd` Lifecycle Hook

Receives a `DrawEndEvent` containing the feature, coordinates, and calculated GIS metrics:

```tsx
<Mapixa
  onDrawEnd={(event) => {
    console.log("Tool used:", event.tool); // 'marker' | 'line' | 'polygon' | 'circle' | etc.
    console.log("GeoJSON Feature:", event.feature);
    console.log("Calculated metrics:", event.metrics);
    // event.metrics?.areaSqKm -> area in square kilometers
    // event.metrics?.distanceKm -> distance in kilometers
    // event.metrics?.radiusKm -> circle radius
  }}
/>
```

### 2. Custom Action Buttons (`extraActions`)

Inject custom action buttons directly into tool dialogs:

```tsx
const customActions = [
  {
    id: "save-to-db",
    label: "Save to Backend",
    variant: "contained",
    color: "primary",
    onClick: async ({ tool, feature, metrics, closeModal }) => {
      await fetch("/api/features", {
        method: "POST",
        body: JSON.stringify({ tool, feature, metrics }),
      });
      alert("Feature saved to server!");
      closeModal?.();
    },
  },
  {
    id: "export-geojson",
    label: "Download GeoJSON",
    variant: "outlined",
    onClick: ({ tool, feature }) => {
      downloadGeoJSON(feature, `${tool}.geojson`);
    },
  },
];

<Mapixa extraActions={customActions} />;
```

### 3. `afterDrawMode` Modes

- `'modal'` _(default)_: Opens the tool's dialog allowing the user to configure styles, view measurements, and trigger custom extra actions.
- `'auto-save'`: Automatically saves the feature to the map and fires `onDrawEnd` immediately without blocking the user.

---

## 👁️ Layer Visibility Control

Every tool has visibility management configured directly via code and props:

### 1. Controlled Visibility Prop

Pass the `visibility` prop directly to `<Mapixa />`. It accepts tool keys and aliases (e.g. `line`, `polyline`, `polyine`, `circle`, `polygon`, `marker`, etc.):

```tsx
<Mapixa
  afterDrawMode="modal"
  extraActions={extraActions}
  onDrawEnd={handleDrawEnd}
  visibility={{
    polyine: true, // polylines visible
    circle: false, // circles hidden
    marker: true, // markers visible
    polygon: true, // polygons visible
  }}
  toolbarGap={12} // customizable gap in px between accordion toolbars (default: 12px)
/>
```

### 2. Programmatic Control with `useLayerVisibility`

```tsx
import { useLayerVisibility } from "mapixa";

function MyComponent() {
  const {
    visibility,
    toggleToolVisibility,
    setToolVisibility,
    setAllVisibility,
  } = useLayerVisibility();

  return (
    <button onClick={() => toggleToolVisibility("polygon")}>
      Toggle Polygons ({visibility.polygon ? "Visible" : "Hidden"})
    </button>
  );
}
```

---

## 🎨 Customizing Background Colors & Theming

You can easily customize the background colors of the **Accordion toolbars** (Draw and Extra tools), **Live Coordinate display**, and **Navigation controls** via React props or CSS variables:

### 1. Via Component Props

Pass `accordionBackground`, `coordinateBackground`, or `navigatorBackground` (or their shorthand `accordionBg`, `coordinateBg`, `navigatorBg`) directly to `<Mapixa />`:

```tsx
<Mapixa
  accordionBackground="rgba(255, 255, 255, 0.95)"
  coordinateBackground="#1e1e1e"
  navigatorBackground="rgba(255, 255, 255, 0.95)"
  // You can also pass custom style objects:
  // accordionStyle={{ backdropFilter: "blur(20px)" }}
  // coordinateStyle={{ color: "#ffffff" }}
  // navigatorStyle={{ borderRadius: "16px" }}
/>
```

When importing individual modular components:

```tsx
<MapDrawTools accordionBackground="#ffffff" />
<ExtraMapTools accordionBackground="#ffffff" />
<CoordinateDisplay backgroundColor="#1e1e1e" />
<MapNavigator backgroundColor="#ffffff" />
```

### 2. Via CSS Custom Properties (Variables)

Override the CSS variables in your global stylesheet or dark mode classes:

```css
:root {
  /* Accordion Draw & Tool boxes */
  --mlt-accordion-bg: rgba(255, 255, 255, 0.92);

  /* Coordinate Readout */
  --mlt-coordinate-bg: rgba(255, 255, 255, 0.92);

  /* Navigation Bar */
  --mlt-navigator-bg: rgba(255, 255, 255, 0.92);
}
```

---

## 🧩 Modular Components

If you prefer custom layouts rather than the all-in-one `<Mapixa />`, you can import individual components:

```tsx
import {
  MapControlBox,
  MapDrawTools,
  ExtraMapTools,
  LayerVisibilityControl,
  MapNavigator,
  CoordinateDisplay,
} from "mapixa";

<MapControlBox position="top-right">
  <MapDrawTools />
  <ExtraMapTools />
  <LayerVisibilityControl />
</MapControlBox>;

<MapControlBox position="bottom-left">
  <CoordinateDisplay />
</MapControlBox>;

<MapControlBox position="top-left">
  <MapNavigator />
</MapControlBox>;
```

---

## 🛠️ Exported Utilities

- `calculateDistanceKm(p1, p2)`: Haversine distance in km.
- `calculateLineDistanceKm(coordinates)`: Total line distance in km.
- `calculatePolygonAreaSqM(coordinates)`: Spherical polygon area in $m^2$.
- `createGeoJSONCircle(center, radiusKm)`: GeoJSON Polygon circle generator.
- `downloadGeoJSON(data, filename)`: Triggers browser download of GeoJSON.
- `copyToClipboard(text)`: Cross-browser clipboard copy.
- `downloadCanvasArea(canvas, rect, filename)`: Canvas crop export.

---

## 📄 License

MIT © [Open Source](LICENSE)
