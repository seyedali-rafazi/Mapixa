# 🗺️ Mapixa

> A high-performance, modular, and extensible suite of drawing, measurement, navigation, and layer visibility tools for **MapLibre GL JS** and **React**. Built with pure CSS, zero bloated UI framework dependencies, and crisp Lucide icons.

[![npm version](https://img.shields.io/npm/v/mapixa.svg?style=flat-square)](https://www.npmjs.com/package/mapixa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

---

## 📑 Table of Contents

- [Features Overview](#-features-overview)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Architecture & Usage Options](#-architecture--usage-options)
  - [1. All-in-One Component (`<Mapixa />`)](#1-all-in-one-component-mapixa-)
  - [2. Compound Components (`Mapixa.Button`, `Mapixa.Accordion`, `Mapixa.BasemapSwitcher`, etc.)](#2-compound-components)
  - [3. Modular / Standalone Imports](#3-modular--standalone-imports)
- [Complete Tools Documentation](#-complete-tools-documentation)
  - [Drawing Tools Suite](#-drawing-tools-suite)
    - [1. Marker Tool (`DrawMarkerControl`)](#1-marker-tool-drawmarkercontrol)
    - [2. Polyline Tool (`DrawLineControl`)](#2-polyline-tool-drawlinecontrol)
    - [3. Polygon Tool (`DrawPolygonControl`)](#3-polygon-tool-drawpolygoncontrol)
    - [4. Circle Tool (`DrawCircleControl`)](#4-circle-tool-drawcirclecontrol)
    - [5. Rectangle Tool (`DrawRectangleControl`)](#5-rectangle-tool-drawrectanglecontrol)
    - [6. Freehand Drawing Tool (`FreeDrawControl`)](#6-freehand-drawing-tool-freedrawcontrol)
    - [7. Line Intersection Detector (`IntersectionControl`)](#7-line-intersection-detector-intersectioncontrol)
    - [8. Interactive Shape Eraser (`DrawEraseControl`)](#8-interactive-shape-eraser-drawerasecontrol)
    - [9. Drawn Layer Manager (`DrawLayerManagerControl`)](#9-drawn-layer-manager-drawlayermanagercontrol)
  - [Measurement & Utility Tools](#-measurement--utility-tools)
    - [10. Distance Ruler Tool (`DrawRulerControl`)](#10-distance-ruler-tool-drawrulercontrol)
    - [11. Area Capture / Screenshot Tool (`CaptureAreaControl`)](#11-area-capture--screenshot-tool-captureareacontrol)
    - [12. Go to Coordinates Tool (`GoToControl`)](#12-go-to-coordinates-tool-gotocontrol)
    - [13. Image Overlay Tool (`ImageOverlayControl`)](#13-image-overlay-tool-imageoverlaycontrol)
  - [Basemap & Overlay System](#-basemap--overlay-system)
    - [14. Basemap Switcher (`BasemapSwitcher`)](#14-basemap-switcher-basemapswitcher)
  - [Layer Visibility System](#-layer-visibility-system)
    - [15. Layer Visibility Control (`LayerVisibilityControl`)](#15-layer-visibility-control-layervisibilitycontrol)
  - [Navigation & Viewport Tools](#-navigation--viewport-tools)
    - [16. Map Navigator (`MapNavigator`)](#16-map-navigator-mapnavigator)
    - [17. Live Coordinate Display & Interactive Picker (`CoordinateDisplay`)](#17-live-coordinate-display--interactive-picker-coordinatedisplay)
    - [18. Fullscreen View Control (`MapViewControl`)](#18-fullscreen-view-control-mapviewcontrol)
    - [19. Map Flat View Enforcer (`MapFlatViewEnforcer`)](#19-map-flat-view-enforcer-mapflatviewenforcer)
    - [20. Map Resize Handler (`MapResizeHandler`)](#20-map-resize-handler-mapresizehandler)
  - [Extensibility & Custom Components](#-extensibility--custom-components)
    - [21. Custom Map Accordion (`MapAccordion`)](#21-custom-map-accordion-mapaccordion)
    - [22. Custom Map Button (`MapButton`)](#22-custom-map-button-mapbutton)
- [Lifecycle Events & After Draw Pipeline](#-lifecycle-events--after-draw-pipeline)
  - [The `onDrawEnd` Event](#1-ondrawend-event)
  - [Injecting Custom Action Buttons (`extraActions`)](#2-injecting-custom-action-buttons-extraactions)
  - [`afterDrawMode` Configurations](#3-afterdrawmode-modes)
- [Styling, Theming & Colors](#-styling-theming--colors)
  - [Via Component Props](#1-via-component-props)
  - [Via CSS Variables](#2-via-css-custom-properties)
- [Exported Hooks & Contexts](#-exported-hooks--contexts)
- [Exported GIS & Utility Functions](#-exported-gis--utility-functions)
- [Component Props Reference](#-component-props-reference)
- [License](#-license)

---

## ✨ Features Overview

- 📍 **Complete Drawing Suite**: Place custom SVG markers, draft polylines, draw multi-point polygons, radius-drag circles, drag rectangles, sketch freehand strokes, and detect intersecting lines.
- 🗂️ **Live Drawn Layer Manager**: Central popover panel managing all drawn shapes across the map. Supports layer naming, inline editing, individual visibility toggling, drag-and-drop layer reordering (controlling visual map z-index), zoom-to-feature camera locate, and batch clear.
- 🧹 **Interactive Shape Eraser**: One-click click-to-delete eraser tool to quickly purge individual shapes from the canvas with instant visual feedback.
- 🗺️ **Basemap & Overlays Switcher**: Dynamically swap raster and vector base map styles (Dark, Light, Voyager, OSM, Demotiles) and toggle customizable map overlays (Traffic, Nautical Seamarks, etc.) with custom opacity.
- 📐 **Measurement & GIS Tools**: Multi-point segment distance ruler, high-res canvas bounding box screenshot export, fly-to coordinate jumper, and movable/scalable georeferenced image overlays.
- 👁️ **Unified Layer Visibility System**: Instantly toggle visibility of markers, polylines, polygons, circles, rectangles, freehand sketches, rulers, and overlays independently or collectively.
- 🎯 **Coordinate Tracker & Interactive Picker**: Modern capsule displaying live cursor coordinates, plus a crosshair point-picking mode that lets users click anywhere on the map to copy exact coordinates to the clipboard.
- ⚡ **"After Draw" Action Pipeline**: Full event lifecycle (`onDrawEnd`, `onDrawStart`, `onDrawChange`, `onDrawDelete`) with calculated metrics (distance in km, spherical area in $m^2$ and $km^2$, radius, perimeter).
- 🧩 **First-Class Extensibility**: Add custom buttons and tool accordions seamlessly using `<MapAccordion />` and `<MapButton />` that adopt the exact same floating glassmorphic styling and behavior.
- 🎨 **Pure CSS & Zero Framework Bloat**: No Material-UI, Tailwind, or Emotion required. Modern floating UI with smooth accordion animations and CSS variable theming.
- 📱 **Responsive & Multi-Map Ready**: Built-in resize observer, 2D flat view enforcer, and full support for `react-map-gl/maplibre` and `maplibre-gl`.

---

## 📦 Installation

```bash
npm install mapixa maplibre-gl react-map-gl
```

*or with yarn:*

```bash
yarn add mapixa maplibre-gl react-map-gl
```

*or with pnpm:*

```bash
pnpm add mapixa maplibre-gl react-map-gl
```

> **Note**: Don't forget to import both the MapLibre CSS and Mapixa CSS in your application root or component:
> ```tsx
> import "maplibre-gl/dist/maplibre-gl.css";
> import "mapixa/style.css";
> ```

---

## 🚀 Quick Start

Drop `<Mapixa />` (or `<MapLibreTools />`) inside any React MapLibre map:

```tsx
import React from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapixa/style.css";
import maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";
import { Mapixa } from "mapixa";

const basemapLayers = [
  {
    id: "light",
    name: "Light Map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  {
    id: "dark",
    name: "Dark Map",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
];

export function App() {
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
        <Mapixa
          showBasemapSwitcher={true}
          basemapLayers={basemapLayers}
          afterDrawMode="modal"
          onDrawEnd={(event) => {
            console.log("Drawn:", event.tool, event.feature, event.metrics);
          }}
          visibility={{ circle: false }}
          toolbarGap={12}
        />
      </Map>
    </div>
  );
}
```

---

## 🏗️ Architecture & Usage Options

Mapixa provides three flexible ways to integrate tools into your map:

### 1. All-in-One Component (`<Mapixa />`)
Mounts the complete suite: Draw Toolbar (top-right), Extra Tools (top-right), Navigator with Basemap Switcher (top-left), Coordinates readout & interactive picker (bottom-left), and Fullscreen button (bottom-right).

```tsx
import { Mapixa } from "mapixa";

<Mapixa
  toolbarPosition="top-right"
  navigatorPosition="top-left"
  coordinatePosition="bottom-left"
  viewControlPosition="bottom-right"
  toolbarGap={12}
  afterDrawMode="modal"
  showBasemapSwitcher={true}
  basemapLayers={myBasemapLayers}
/>
```

### 2. Compound Components
All modular pieces are attached to `Mapixa` for convenient namespaced usage (`Mapixa.Button`, `Mapixa.Accordion`, `Mapixa.BasemapSwitcher`, `Mapixa.DrawLayersManager`, `Mapixa.DrawErase`, etc.):

```tsx
import { Mapixa } from "mapixa";

<Mapixa>
  {/* Custom Accordion inside the toolbar */}
  <Mapixa.Accordion title="ANALYTICS" icon={<MyIcon />}>
    <Mapixa.Button tooltip="Run Buffer" onClick={handleBuffer} />
  </Mapixa.Accordion>

  {/* Standalone floating button */}
  <Mapixa.Button
    position="bottom-right"
    tooltip="Fly to Landmark"
    onClick={(_e, map) => map?.flyTo({ center: [0, 0], zoom: 5 })}
  />

  {/* Standalone floating Basemap Switcher */}
  <Mapixa.BasemapSwitcher
    position="top-left"
    layers={myBasemapLayers}
  />
</Mapixa>
```

### 3. Modular / Standalone Imports
Pick and choose only the components you need, placing them anywhere on the map:

```tsx
import {
  MapControlBox,
  MapDrawTools,
  ExtraMapTools,
  LayerVisibilityControl,
  MapNavigator,
  CoordinateDisplay,
  MapViewControl,
} from "mapixa";

{/* Custom Top Right Tools */}
<MapControlBox position="top-right">
  <MapDrawTools />
  <ExtraMapTools />
</MapControlBox>

{/* Standalone Bottom Controls */}
<MapControlBox position="bottom-left">
  <CoordinateDisplay precision={6} />
</MapControlBox>

<MapControlBox position="bottom-right">
  <MapViewControl />
</MapControlBox>
```

---

## 📖 Complete Tools Documentation

Mapixa organizes tools into logical suites. Below is the comprehensive documentation for every tool in the package:

---

### 🎨 Drawing Tools Suite

Located in the **`DRAW`** accordion toolbar (`MapDrawTools`) or imported as standalone controls.

#### 1. Marker Tool (`DrawMarkerControl`)
- **Tool Key**: `"marker"`
- **Component**: `DrawMarkerControl`
- **Description**: Allows users to place pinpoint markers anywhere on the map with customizable iconography, colors, opacity, and labels.
- **User Interaction**:
  1. Click the Marker icon in the Draw toolbar to activate.
  2. Click anywhere on the map to place the marker.
  3. In `'modal'` mode, a dialog appears allowing immediate styling and labeling.
- **Configurable Attributes in Dialog**:
  - **Label / Name**: Custom text label stored in feature properties.
  - **Coordinates**: Live latitude & longitude coordinates.
  - **Pin Color**: Color picker for the outer pin SVG body.
  - **Icon Type**: Choose between 4 distinct inner glyphs: `star`, `circle`, `square`, or `pin`.
  - **Icon Color**: Color picker for the inner glyph.
  - **Size**: Slider from 20px to 64px (default: 38px).
  - **Opacity**: Slider from 10% to 100%.
- **Actions in Dialog**:
  - Copy coordinates to clipboard.
  - Delete marker from map.
  - Trigger custom `extraActions`.
- **Output GeoJSON**: Point Feature with properties (`{ id, name, markerColor, iconType, iconColor, size, opacity }`).
- **Layer Visibility**: Controlled under `"marker"`.

```tsx
<Mapixa
  toolsConfig={{
    marker: {
      enabled: true,
      visible: true,
      afterDrawMode: "modal",
    },
  }}
/>
```

---

#### 2. Polyline Tool (`DrawLineControl`)
- **Tool Key**: `"line"` (or aliases: `"polyline"`, `"polyine"`)
- **Component**: `DrawLineControl`
- **Description**: Multi-vertex line drawing tool with interactive rubberband cursor tracking and real-time geodesic distance calculations.
- **User Interaction**:
  1. Click the Polyline icon to activate.
  2. Click on the map to place vertex points. A live dashed guide follows the cursor.
  3. Click the **Finish (Checkmark)** button in the toolbar or **double-click** to end the line.
- **Calculated Metrics**:
  - Geodesic line distance in kilometers (`metrics.distanceKm`), computed using the Haversine formula across all segments.
- **Configurable Attributes in Dialog**:
  - **Name / Description**: Label for the line.
  - **Stroke Color**: Color picker (default: `#007aff`).
  - **Stroke Width**: Slider from 1px to 12px (default: 4px).
  - **Opacity**: Slider from 10% to 100%.
  - **Distance Display**: Displays total length in kilometers.
- **Actions in Dialog**:
  - Copy coordinate array as JSON.
  - Delete line.
  - Custom `extraActions`.
- **Output GeoJSON**: LineString Feature (`type: "LineString"`, coordinates array).

---

#### 3. Polygon Tool (`DrawPolygonControl`)
- **Tool Key**: `"polygon"`
- **Component**: `DrawPolygonControl`
- **Description**: Draw multi-vertex closed polygons with real-time spherical area calculation, vertex handle rendering, and perimeter preview.
- **User Interaction**:
  1. Click the Polygon icon to activate.
  2. Click to place vertices (minimum 3 vertices required).
  3. Click the **Finish (Checkmark)** button or double-click to close the polygon.
- **Calculated Metrics**:
  - `metrics.areaSqKm`: Calculated spherical area in square kilometers.
  - `metrics.areaSqM`: Calculated spherical area in square meters.
  - `metrics.pointCount`: Total number of vertices.
- **Configurable Attributes in Dialog**:
  - **Name / Title**.
  - **Fill Color**: Hex or RGBA fill color (default: `#ff9500`).
  - **Fill Opacity**: Slider from 0% to 100%.
  - **Outline Color**: Border stroke color.
  - **Area Readout**: Live display of area in $m^2$ and $km^2$.
- **Actions in Dialog**:
  - Copy coordinates array.
  - Delete polygon.
  - Custom `extraActions`.
- **Output GeoJSON**: Polygon Feature (`type: "Polygon"`, closed linear ring coordinates).

---

#### 4. Circle Tool (`DrawCircleControl`)
- **Tool Key**: `"circle"`
- **Component**: `DrawCircleControl`
- **Description**: Draw geodesic circles on the map by dragging outward from a center point. Automatically generates a 64-vertex smooth GeoJSON Polygon representation.
- **User Interaction**:
  1. Click the Circle icon to activate.
  2. Click once on the map to set the circle center point.
  3. Move the cursor outward; a live radius circle previews dynamically with distance calculations.
  4. Click a second time to lock the radius and finalize.
- **Calculated Metrics**:
  - `metrics.radiusKm`: Circle radius in kilometers.
  - `metrics.areaSqKm`: Total circular area ($\pi r^2$).
- **Configurable Attributes in Dialog**:
  - **Name**: Circle identifier.
  - **Center & Radius Readout**: Center coordinates and radius in km.
  - **Fill Color & Fill Opacity**: Color and opacity percentage.
  - **Outline Color**: Circle border color.
- **Actions in Dialog**:
  - Copy center and radius JSON.
  - Delete circle.
  - Custom `extraActions`.
- **Output GeoJSON**: 64-vertex Polygon Feature centered at target coordinates.

---

#### 5. Rectangle Tool (`DrawRectangleControl`)
- **Tool Key**: `"rectangle"`
- **Component**: `DrawRectangleControl`
- **Description**: Draw axis-aligned rectangular bounding boxes using two opposite corner points with live area metrics.
- **User Interaction**:
  1. Click the Rectangle icon to activate.
  2. Click and hold or click once to set the first corner ($P_1$).
  3. Drag or click the opposite diagonal corner ($P_2$) to complete the rectangle.
- **Calculated Metrics**:
  - `metrics.areaSqKm`: Spherical area in square kilometers.
  - `metrics.areaSqM`: Spherical area in square meters.
- **Configurable Attributes in Dialog**:
  - **Name**: Rectangle title.
  - **Fill Color & Opacity**: Fill styling (default: `#34c759`).
  - **Outline Color**: Border styling.
  - **Area Readout**: Displayed in $km^2$.
- **Output GeoJSON**: 5-point closed Polygon Feature.

---

#### 6. Freehand Drawing Tool (`FreeDrawControl`)
- **Tool Key**: `"freedraw"`
- **Component**: `FreeDrawControl`
- **Description**: Sketch fluid strokes directly across the map by dragging the mouse. Smoothly streams coordinates into GeoJSON LineStrings without requiring individual point clicks.
- **User Interaction**:
  1. Click the Freehand Pen icon to activate sketch mode. Map panning is temporarily disabled.
  2. Press and hold the left mouse button, then drag to draw freely.
  3. Release mouse button to commit stroke.
- **Settings Popover**:
  - Click the tool's tuning icon to open the popover:
    - **Stroke Color**: Pick stroke color (default: `#ff2d55`).
    - **Stroke Width**: Slider from 1px to 16px (default: 4px).
    - **Clear Strokes**: Clears all active freehand sketches from the map.
- **Output GeoJSON**: Multi-point LineString Feature.
- **Layer Visibility**: Controlled under `"freedraw"`.

---

#### 7. Line Intersection Detector (`IntersectionControl`)
- **Tool Key**: `"intersection"`
- **Component**: `IntersectionControl`
- **Description**: Draw two intersecting lines across the map. The tool automatically detects segment intersections, computes their exact geographic coordinates ($[lng, lat]$), renders glowing highlight markers at crossing points, and presents them in a detailed report modal.
- **User Interaction**:
  1. Click the Split/Intersect icon to activate.
  2. Click to draw the first line (click points, double-click to finish).
  3. Click to draw the second line intersecting the first.
  4. The intersection engine instantly computes the crossing coordinate and opens the Intersection Modal.
- **Modal Data**:
  - Displays all intersection points found.
  - Individual "Copy" buttons for each intersection point coordinate.
  - Clear / reset button.

---

#### 8. Interactive Shape Eraser (`DrawEraseControl`)
- **Tool Key**: `"erase"`
- **Component**: `DrawEraseControl` (or `Mapixa.DrawErase`)
- **Description**: Rapid interactive eraser tool that turns the mouse into a deletion cursor. Allows users to click on any drawn shape, line, polygon, circle, rectangle, or freehand stroke on the map canvas to immediately remove it.
- **User Interaction**:
  1. Click the **Eraser** button in the Draw toolbar.
  2. The button highlights with an active red badge and an informative toast confirms eraser mode is active.
  3. Click directly on any drawn feature on the map to permanently delete it.
  4. Click the Eraser button again to deactivate and return to normal map interaction.
- **Configurable**: Configured via `toolsConfig={{ erase: { visible: true } }}`.

---

#### 9. Drawn Layer Manager (`DrawLayerManagerControl`)
- **Tool Key**: `"layerManager"`
- **Component**: `DrawLayerManagerControl` (or `Mapixa.DrawLayersManager`)
- **Description**: Central management hub for all drawn vector features across the map. Opens an interactive popover displaying a live list of every marker, polyline, polygon, circle, rectangle, freehand sketch, and intersection marker currently rendered.
- **Features & Controls**:
  - **Dynamic Item Count Badge**: Button shows the exact total number of drawn features on the map.
  - **Tool-Specific Shape Badges**: Each layer item displays its shape icon (Marker, Line, Polygon, Circle, Rectangle, Freehand, Intersection) along with a color swatch showing its fill/stroke color.
  - **Inline Label Editing**: Click the Edit (Pencil) icon to rename any shape inline on the fly.
  - **Locate & Zoom to Feature**: Click the Target/Locate icon to smoothly pan and zoom the map camera directly to that feature's bounding box.
  - **Individual Visibility Toggles**: Click the Eye / EyeOff icon on any item to temporarily show or hide that specific feature on the map.
  - **Global Visibility Toggle**: Header master toggle to instantly show or hide all drawn layers.
  - **Drag-and-Drop & Reordering Buttons**: Drag items or use Up/Down arrow buttons to adjust the layer stacking order (z-index) on the map canvas.
  - **Delete & Clear All**: Delete individual items or click "Clear All" with confirmation.
- **Configurable**: Configured via `toolsConfig={{ layerManager: { visible: true } }}`.

---

### 📐 Measurement & Utility Tools

Located in the **`TOOL`** accordion toolbar (`ExtraMapTools`) or imported as standalone controls.

#### 10. Distance Ruler Tool (`DrawRulerControl`)
- **Tool Key**: `"ruler"`
- **Component**: `DrawRulerControl`
- **Description**: Multi-point geodesic distance measuring tape. Computes individual segment distances, cumulative path length, and renders persistent floating distance tags directly on each segment of the map.
- **User Interaction**:
  1. Click the Ruler icon to activate.
  2. Click anywhere to place the starting point.
  3. Click subsequent points along any road, trail, or flight path.
  4. Floating labels automatically display segment lengths (e.g. `2.45 km`) and total path distance.
  5. Double-click or click the checkmark to finish.
- **Modal Summary**:
  - Total distance in kilometers.
  - Number of measuring points.
  - Copy coordinates and delete measurement options.
- **Layer Visibility**: Controlled under `"ruler"`.

---

#### 11. Area Capture / Screenshot Tool (`CaptureAreaControl`)
- **Tool Key**: `"capture"`
- **Component**: `CaptureAreaControl`
- **Description**: Drag-to-select marquee crop tool that captures a high-resolution PNG image directly from the MapLibre WebGL canvas.
- **User Interaction**:
  1. Click the Crop / Camera icon to activate. Cursor switches to crosshair.
  2. Click and drag a marquee selection box over the desired map area.
  3. Upon release, the selected canvas region is cropped and a preview modal opens.
- **Modal Features**:
  - High-res image preview of the captured area.
  - Custom file name input (default: `map-screenshot.png`).
  - One-click **Download PNG** button.
  - Trigger custom `extraActions` (e.g., upload screenshot to cloud).

---

#### 12. Go to Coordinates Tool (`GoToControl`)
- **Tool Key**: `"goto"`
- **Component**: `GoToControl`
- **Description**: Precision navigation popover that flies the camera smoothly to any latitude, longitude, and zoom level.
- **User Interaction**:
  1. Click the GPS Target icon in the Extra Tools toolbar.
  2. A popover opens with input fields:
     - **Latitude**: Validated between $-90^\circ$ and $+90^\circ$.
     - **Longitude**: Validated between $-180^\circ$ and $+180^\circ$.
     - **Zoom Level**: Target zoom level from 1 to 22.
  3. Click **"Go to Location"** or press Enter. The map triggers an animated `flyTo` transition.

---

#### 13. Image Overlay Tool (`ImageOverlayControl`)
- **Tool Key**: `"overlay"`
- **Component**: `ImageOverlayControl`
- **Description**: Georeferenced image overlay tool. Allows users to import external raster imagery (blueprints, site plans, drone orthomosaics, floorplans) and position them directly on the map coordinates.
- **Features & Controls**:
  - **Add Image Dialog**: Provide image URL and optional name. Places image at the current map center.
  - **Drag to Reposition**: Drag the image directly across the map to position it.
  - **Tuning Popover**:
    - **Scale Slider**: Resize image from 0.1x to 5.0x.
    - **Rotation Slider**: Rotate image from $0^\circ$ to $360^\circ$.
    - **Opacity Slider**: Adjust transparency from 10% to 100%.
    - **Delete**: Remove overlay.
- **Layer Visibility**: Controlled under `"overlay"`.

---

### 🗺️ Basemap & Overlay System

#### 14. Basemap Switcher (`BasemapSwitcher`)
- **Component**: `BasemapSwitcher` (or `Mapixa.BasemapSwitcher`)
- **Description**: A comprehensive style and layer switcher popover. Enables dynamic switching between base styles (e.g., Carto Dark Matter, Positron Light, Voyager, OpenStreetMap, MapLibre Demotiles) and toggling transparent overlays (such as live traffic, nautical seamarks, contour lines, or administrative boundaries) with custom opacity.
- **Flexible Usage**:
  1. **Integrated in Navigator**: Set `showBasemapSwitcher={true}` and pass `basemapLayers` directly to `<Mapixa />` or `<MapNavigator />`.
  2. **Standalone Floating**: Render `<BasemapSwitcher position="top-left" layers={layers} overlays={overlays} />`.
  3. **Compound Component**: `<Mapixa.BasemapSwitcher layers={layers} />`.
- **Props & Options**:
  - `layers` (`layer`): Array of `BasemapLayerItem` (`{ id, name, style, thumbnail, icon, description, default }`).
  - `overlays` (`overlay`): Array of `BasemapOverlayItem` (`{ id, name, style, opacity, source, layers, default }`).
  - `defaultLayerId` / `activeLayerId`: Selected active base style ID.
  - `onLayerChange`: Fired when a base layer is selected.
  - `onOverlayChange`: Fired when active overlay IDs toggle.
  - `popoverPlacement`: `'left' | 'right' | 'top' | 'bottom' | 'auto'`.

```tsx
import { BasemapSwitcher, type BasemapLayerItem, type BasemapOverlayItem } from "mapixa";

const basemaps: BasemapLayerItem[] = [
  { id: "dark", name: "Dark Matter", style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { id: "light", name: "Positron Light", style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" },
];

const overlays: BasemapOverlayItem[] = [
  {
    id: "seamarks",
    name: "OpenSeaMap Marine",
    style: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
    opacity: 0.8,
  },
];

// As a standalone control:
<BasemapSwitcher
  position="top-left"
  layers={basemaps}
  overlays={overlays}
  onLayerChange={(layer) => console.log("Active base style:", layer.name)}
/>
```

---

### 👁️ Layer Visibility System

#### 15. Layer Visibility Control (`LayerVisibilityControl`)
- **Component**: `LayerVisibilityControl`
- **Description**: Floating toggle menu allowing users to show or hide individual feature layers on the fly without deleting their underlying data.
- **Supported Tool Layers**:
  - Markers (`marker`)
  - Lines / Polylines (`line`, `polyline`, `polyine`)
  - Polygons (`polygon`)
  - Circles (`circle`)
  - Rectangles (`rectangle`)
  - Freehand Drawings (`freedraw`)
  - Distance Rulers (`ruler`)
  - Image Overlays (`overlay`)
- **Features**:
  - Toggle each layer individually with instant map update.
  - Master **"Show All"** / **"Hide All"** button.
  - Fully reactive via `useLayerVisibility()` hook and the root `visibility` prop.

```tsx
<Mapixa
  // Controlled visibility state
  visibility={{
    polyine: true,
    circle: false,
    marker: true,
    polygon: true,
  }}
  onVisibilityChange={(tool, visible, allState) => {
    console.log(`Layer ${tool} is now ${visible ? "visible" : "hidden"}`);
  }}
/>
```

---

### 🧭 Navigation & Viewport Tools

#### 16. Map Navigator (`MapNavigator`)
- **Component**: `MapNavigator`
- **Default Position**: `top-left`
- **Description**: Vertical glassmorphic navigation panel housing essential map controls:
  - **Basemap Switcher**: Embedded popover trigger when `showBasemapSwitcher={true}` is enabled.
  - **Home Button (`HomeIcon`)**: Smoothly flies back to the initial `homeCenter` (default: `[51.389, 35.6892]`) and `homeZoom` (default: `11`), resetting pitch and bearing.
  - **Compass / North Button (`CompassIcon`)**: Instantly resets camera bearing to North ($0^\circ$) and resets pitch to $0^\circ$ (flat view).
  - **Zoom In (`PlusIcon`)**: Incremental step zoom in.
  - **Zoom Out (`MinusIcon`)**: Incremental step zoom out.
  - **Locate Me / GPS (`GpsIcon`)**: Triggers HTML5 Geolocation API, animates camera to user's current GPS position, and displays accuracy feedback.
  - **Box Zoom (`BoxZoomIcon`)**: Toggles rubberband box-zoom mode. Users can drag a box to zoom directly into that bounding region.
- **Customizable**:
  - `showBasemapSwitcher`: Toggles the embedded basemap switcher button.
  - `basemapLayers`: List of basemap styles.
  - `basemapOverlays`: List of overlay layers.
  - `homeCenter`: `[longitude, latitude]` array.
  - `homeZoom`: Target zoom level.
  - `backgroundColor`: Custom background color or CSS gradient.

---

#### 17. Live Coordinate Display & Interactive Picker (`CoordinateDisplay`)
- **Component**: `CoordinateDisplay`
- **Default Position**: `bottom-left`
- **Description**: Real-time cursor coordinate tracking and interactive coordinate picking panel styled as a modern dark glassmorphic capsule.
- **Features**:
  - **Dynamic Tracking**: Updates latitude and longitude continuously as the cursor glides across the map canvas.
  - **Configurable Precision**: Pass `precision={5}` (default: 5 decimal places, approx. 1 meter accuracy).
  - **Click-to-Copy Current Cursor**: One-click copy icon copies the active coordinate pair directly to clipboard.
  - **Interactive Map Point Picker**: Clicking the copy button activates crosshair picker mode (`cursor: crosshair`). Click anywhere on the map to pin the point, copy its exact coordinates to the clipboard, and receive instant toast feedback. Press `Escape` to cancel picker mode.
  - **Dark / Light Auto-Contrast**: Automatically adjusts text contrast based on background color luminance.

---

#### 18. Fullscreen View Control (`MapViewControl`)
- **Component**: `MapViewControl`
- **Default Position**: `bottom-right`
- **Description**: Standalone button providing a native browser Fullscreen API toggle. Automatically synchronizes its icon state (`FullscreenIcon` / `FullscreenExitIcon`) on escape key or browser window mode changes.

---

#### 19. Map Flat View Enforcer (`MapFlatViewEnforcer`)
- **Component**: `MapFlatViewEnforcer`
- **Description**: Background utility component mounted automatically by `<Mapixa />` when `enforceFlatView={true}` (the default). Ensures map pitch remains at $0^\circ$ and disables 3D pitch gestures for standard 2D cartographic operations.

---

#### 20. Map Resize Handler (`MapResizeHandler`)
- **Component**: `MapResizeHandler`
- **Description**: Background utility component that monitors viewport dimensions and container DOM resizing. Automatically triggers `map.resize()` to eliminate grey tiles, distorted canvas aspect ratios, or rendering artifacts during layout shifts.

---

### 🧩 Extensibility & Custom Components

Mapixa makes it trivial to add your own proprietary GIS actions and navigation tools while matching the design system perfectly.

#### 21. Custom Map Accordion (`MapAccordion`)
- **Component**: `MapAccordion`
- **Description**: Collapsible floating accordion panel. Automatically portals into the Mapixa toolbar column or can be positioned anywhere on the map using the `position` prop.
- **Props**:
  - `title` / `label`: Header text displayed on the button (e.g. `"CUSTOM"`, `"LAYERS"`).
  - `icon`: React node / Lucide icon displayed on the button.
  - `tooltip`: Hover description.
  - `position`: Control position (`"toolbar"` | `"top-left"` | `"top-right"` | `"bottom-left"` | `"bottom-right"`).
  - `independent`: If `true`, this accordion will not auto-close when other accordions open.
  - `backgroundColor`: Custom background color.
  - `footer`: Optional bottom element.

#### 22. Custom Map Button (`MapButton`)
- **Component**: `MapButton`
- **Description**: Unified icon button component supporting tooltips, active states, badges, and direct access to the `maplibregl.Map` instance.
- **Dual Mode**:
  - **Inside an Accordion**: Automatically integrates into the accordion's grid layout.
  - **Standalone Floating**: Supply `position="bottom-right"` (or any position) to render as a floating glassmorphic map button.
- **Props**:
  - `icon`: Icon component (e.g. Lucide icon).
  - `tooltip` / `title`: Tooltip text.
  - `active`: Boolean indicating active toggle highlight.
  - `badge`: String or number badge displayed on the corner (e.g. `"ON"`, `5`).
  - `onClick`: `(event, map) => void`. The active `maplibregl.Map` instance is passed as the second argument!

#### Example: Adding Custom Accordion and Floating Button
```tsx
import { Mapixa, MapAccordion, MapButton } from "mapixa";
import { Sparkles, Plane, Compass } from "lucide-react";

<Mapixa>
  {/* Custom Accordion inside Toolbar */}
  <MapAccordion
    title="LANDMARKS"
    tooltip="Fly to points of interest"
    icon={<Sparkles size={18} />}
  >
    <MapButton
      icon={<Plane size={18} />}
      tooltip="Fly to Airport"
      onClick={(_e, map) => {
        map?.flyTo({ center: [51.31, 35.68], zoom: 14 });
      }}
    />
    <MapButton
      icon={<Sparkles size={18} />}
      tooltip="Active Feature"
      active={true}
      badge="NEW"
      onClick={() => alert("Feature toggled!")}
    />
  </MapAccordion>

  {/* Standalone Custom Floating Button */}
  <MapButton
    position="bottom-right"
    icon={<Compass size={18} />}
    tooltip="Reset Center"
    onClick={(_e, map) => {
      map?.flyTo({ center: [51.389, 35.6892], zoom: 11 });
    }}
  />
</Mapixa>
```

---

## ⚡ Lifecycle Events & After Draw Pipeline

Mapixa provides an event pipeline that delivers complete GeoJSON features, coordinates, and calculated GIS metrics upon drawing completion.

### 1. `onDrawEnd` Event

Fires whenever any shape, marker, or measurement completes:

```tsx
<Mapixa
  onDrawEnd={(event) => {
    console.log("Tool:", event.tool);       // 'marker' | 'line' | 'polygon' | 'circle' | 'rectangle' | etc.
    console.log("ID:", event.id);           // Unique string ID
    console.log("GeoJSON:", event.feature); // Standard GeoJSON Feature object
    console.log("Coordinates:", event.coordinates);
    console.log("Properties:", event.properties);

    // Calculated metrics:
    if (event.metrics?.areaSqKm) {
      console.log(`Area: ${event.metrics.areaSqKm} km²`);
      console.log(`Area in m²: ${event.metrics.areaSqM} m²`);
    }
    if (event.metrics?.distanceKm) {
      console.log(`Length: ${event.metrics.distanceKm} km`);
    }
    if (event.metrics?.radiusKm) {
      console.log(`Circle Radius: ${event.metrics.radiusKm} km`);
    }
  }}
/>
```

#### Event Interfaces

```typescript
export interface DrawEndEvent {
  id: string;
  tool: ToolType;
  feature: {
    type: "Feature";
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: Record<string, any>;
  };
  coordinates: any;
  properties: Record<string, any>;
  metrics?: ToolMetrics;
  raw?: any;
}

export interface ToolMetrics {
  distanceKm?: number;
  areaSqM?: number;
  areaSqKm?: number;
  radiusKm?: number;
  perimeterKm?: number;
  pointCount?: number;
}
```

---

### 2. Injecting Custom Action Buttons (`extraActions`)

Inject custom action buttons directly into tool styling modals (e.g. Save to Cloud API, Export KML, Buffer calculation, Copy to Clipboard):

```tsx
import { downloadGeoJSON, copyToClipboard } from "mapixa";
import type { ExtraActionItem } from "mapixa";

const customActions: ExtraActionItem[] = [
  {
    id: "save-to-backend",
    label: "Save to API",
    variant: "contained", // 'contained' | 'outlined' | 'text'
    color: "primary",     // 'primary' | 'secondary' | 'success' | 'error' | 'warning'
    onClick: async ({ tool, feature, metrics, closeModal }) => {
      await fetch("/api/geo-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, feature, metrics }),
      });
      alert(`${tool} successfully saved!`);
      closeModal?.();
    },
  },
  {
    id: "download-geojson",
    label: "Export GeoJSON",
    variant: "outlined",
    onClick: ({ tool, feature }) => {
      downloadGeoJSON(feature, `${tool}-${Date.now()}.geojson`);
    },
  },
  {
    id: "copy-coords",
    label: "Copy Coords",
    variant: "text",
    onClick: ({ coordinates }) => {
      copyToClipboard(JSON.stringify(coordinates));
    },
  },
];

<Mapixa extraActions={customActions} />;
```

---

### 3. `afterDrawMode` Modes

Configure what happens the instant a user finishes drawing:

- **`"modal"`** *(Default)*: Opens the tool configuration dialog allowing the user to name the feature, customize colors/stroke/opacity, view calculated metrics, and trigger `extraActions`.
- **`"auto-save"`**: Commits the shape directly to the map and fires `onDrawEnd` immediately without opening a modal.
- **`"callback"`**: Triggers `onDrawEnd` immediately without persisting local modal state.

---

## 🎨 Styling, Theming & Colors

Mapixa features automatic dark/light contrast adaptation, glassmorphic backdrop filters, and flexible color customization.

### 1. Via Component Props

Pass colors directly to `<Mapixa />`:

```tsx
<Mapixa
  // 1. Shared background color for all panels & modals
  color="#1e1e1e"

  // 2. Or granular colors per control:
  colors={{
    accordion: "rgba(30, 30, 30, 0.95)",
    coordinate: "#121212",
    navigator: "rgba(30, 30, 30, 0.95)",
    fullscreen: "#121212",
    modal: "#222222",
    popover: "#222222",
  }}

  // 3. Or individual shorthand props:
  accordionBackground="rgba(255, 255, 255, 0.9)"
  coordinateBackground="#ffffff"
  navigatorBackground="rgba(255, 255, 255, 0.9)"
  fullscreenBackground="#ffffff"
  modalBackground="#ffffff"
  popoverBackground="#ffffff"
/>
```

### 2. Via CSS Custom Properties

Override CSS variables in your stylesheet:

```css
:root {
  /* Accordion Toolbars (Draw & Extra tools) */
  --mlt-accordion-bg: rgba(255, 255, 255, 0.92);

  /* Live Coordinate Readout */
  --mlt-coordinate-bg: rgba(255, 255, 255, 0.92);

  /* Navigation Bar */
  --mlt-navigator-bg: rgba(255, 255, 255, 0.92);

  /* Modal Background */
  --mlt-modal-bg: #ffffff;
}
```

---

## 🪝 Exported Hooks & Contexts

| Hook / Context | Description |
|---|---|
| `useMapTool()` | Access active tool state, draw callbacks (`onDrawEnd`, `onDrawDelete`), and tool configurations. |
| `useExclusiveTool(toolName)` | Manages mutual exclusion between tools (e.g. activating `'polygon'` deactivates `'marker'`). Returns `[isActive, setIsActive]`. |
| `useDrawLayers()` | Programmatic access to all drawn vector shapes: `{ drawnLayers, isEraserMode, toggleEraserMode, addDrawnLayer, updateDrawnLayer, removeDrawnLayer, clearAllDrawnLayers, reorderDrawnLayers, toggleLayerVisibility, zoomToLayer }`. |
| `useLayerVisibility()` | Programmatic access to tool layer visibility: `{ visibility, isToolVisible, toggleToolVisibility, setToolVisibility, setAllVisibility }`. |
| `useAccordionGroupItem(id)` | Manages accordion open/collapsed mutual exclusion. |
| `useAccordionContext()` | Checks whether a component is currently rendered inside a parent accordion. |
| `useToolbarContext()` | Accesses the shared toolbar DOM element for dynamic portaling. |

---

## 🛠️ Exported GIS & Utility Functions

Mapixa exports standalone GIS calculation and export utilities ready to use anywhere in your project:

```tsx
import {
  calculateDistanceKm,
  calculateLineDistanceKm,
  calculatePolygonAreaSqM,
  createGeoJSONCircle,
  getMidpoint,
  getLineIntersection,
  downloadGeoJSON,
  copyToClipboard,
  downloadCanvasArea,
  generateMarkerSvg,
  isDarkColor,
} from "mapixa";
```

### Reference

- **`calculateDistanceKm(p1: [number, number], p2: [number, number]): number`**  
  Computes great-circle distance between two $[lng, lat]$ points in kilometers using the Haversine formula.

- **`calculateLineDistanceKm(coordinates: number[][]): number`**  
  Calculates the total length of a polyline across all coordinate vertices in kilometers.

- **`calculatePolygonAreaSqM(coordinates: number[][]): number`**  
  Computes spherical polygon area in square meters ($m^2$) for any closed coordinate ring.

- **`createGeoJSONCircle(center: [number, number], radiusKm: number, points = 64): Feature<Polygon>`**  
  Generates a high-resolution geodesic GeoJSON circle polygon centered at target coordinates.

- **`getMidpoint(p1: [number, number], p2: [number, number]): [number, number]`**  
  Computes geographic midpoint $[lng, lat]$ between two points.

- **`getLineIntersection(p1, p2, p3, p4): [number, number] | null`**  
  Calculates the intersection point between two line segments ($P_1 \to P_2$ and $P_3 \to P_4$).

- **`downloadGeoJSON(data: any, filename?: string): void`**  
  Triggers immediate browser file download of GeoJSON data.

- **`downloadCanvasArea(canvas: HTMLCanvasElement, rect: DOMRect, filename?: string): void`**  
  Crops a specified bounding box from a WebGL canvas and triggers PNG download.

- **`copyToClipboard(text: string): Promise<boolean>`**  
  Safe cross-browser clipboard copy with fallback support.

- **`generateMarkerSvg(config: MarkerSvgConfig): string`**  
  Generates data-URI SVG string for custom map pins.

---

## 📋 Component Props Reference

### `<Mapixa />` / `<MapLibreTools />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `toolbarPosition` | `ControlPosition` | `'top-right'` | Map corner for the Draw and Extra toolbars (`'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`). |
| `navigatorPosition` | `ControlPosition` | `'top-left'` | Map corner for the navigation controls. |
| `coordinatePosition` | `ControlPosition` | `'bottom-left'` | Map corner for the live coordinate readout. |
| `viewControlPosition` | `ControlPosition` | `'bottom-right'` | Map corner for the fullscreen control. |
| `toolbarGap` | `number` | `12` | Pixel spacing between accordion toolbars in the toolbar column. |
| `afterDrawMode` | `'modal' \| 'auto-save' \| 'callback'` | `'modal'` | Post-drawing action mode. |
| `extraActions` | `ExtraActionItem[]` | `[]` | Custom action buttons injected into tool dialogs. |
| `visibility` | `Partial<LayerVisibilityState>` | `undefined` | Controlled layer visibility state. |
| `initialVisibility` | `Partial<LayerVisibilityState>` | `undefined` | Uncontrolled default layer visibility. |
| `toolsConfig` | `ToolsConfiguration` | `undefined` | Enable/disable individual tools (`marker`, `line`, `polygon`, `circle`, `rectangle`, `freedraw`, `ruler`, `capture`, `goto`, `overlay`, `erase`, `layerManager`, `intersection`). |
| `showDrawTools` | `boolean` | `true` | Show or hide the Draw tools accordion. |
| `showExtraTools` | `boolean` | `true` | Show or hide the Extra tools accordion. |
| `showNavigator` | `boolean` | `true` | Show or hide the Navigator panel. |
| `showCoordinates` | `boolean` | `true` | Show or hide the Coordinate display panel. |
| `showFullscreen` | `boolean` | `true` | Show or hide the Fullscreen button. |
| `enforceFlatView` | `boolean` | `true` | Enforce 2D flat view and disable 3D camera pitch. |
| `autoResize` | `boolean` | `true` | Automatically handle canvas resize events. |
| `showBasemapSwitcher` | `boolean` | `false` | Enable or disable the basemap switcher trigger inside the navigator. |
| `basemapLayers` | `BasemapLayerItem[]` | `undefined` | Custom array of selectable basemap styles. |
| `basemapOverlays` | `BasemapOverlayItem[]` | `undefined` | Custom array of toggleable transparent overlays. |
| `basemapSwitcherProps` | `Partial<BasemapSwitcherProps>` | `undefined` | Advanced configuration options for the basemap switcher. |
| `color` | `string` | `undefined` | Unified background color for all panels and dialogs. |
| `colors` | `object` | `undefined` | Granular colors map for accordion, coordinate, navigator, modal, and popover. |
| `accordionBackground` | `string` | `undefined` | Custom background for accordion toolbars. |
| `coordinateBackground` | `string` | `undefined` | Custom background for coordinate display. |
| `navigatorBackground` | `string` | `undefined` | Custom background for navigator controls. |
| `fullscreenBackground` | `string` | `undefined` | Custom background for fullscreen control. |
| `modalBackground` | `string` | `undefined` | Custom background for modal dialogs. |
| `popoverBackground` | `string` | `undefined` | Custom background for popovers. |
| `onDrawEnd` | `(event: DrawEndEvent) => void` | `undefined` | Callback fired when any tool finishes drawing. |
| `onDrawStart` | `(tool: ToolType) => void` | `undefined` | Callback fired when drawing begins. |
| `onDrawChange` | `(event: DrawChangeEvent) => void` | `undefined` | Callback fired when shapes change. |
| `onDrawDelete` | `(event: DrawDeleteEvent) => void` | `undefined` | Callback fired when a feature is deleted. |
| `onVisibilityChange` | `(tool, visible, allState) => void` | `undefined` | Callback fired when a layer's visibility toggles. |

---

### `<BasemapSwitcher />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `layers` / `layer` | `BasemapLayerItem[]` | `[]` | List of selectable base map styles (`{ id, name, style, thumbnail, icon, description, default }`). |
| `overlays` / `overlay` | `BasemapOverlayItem[]` | `[]` | List of toggleable transparent map overlays (`{ id, name, style, opacity, source, layers, default }`). |
| `defaultLayerId` | `string` | `undefined` | ID of the initially active basemap. |
| `activeLayerId` | `string` | `undefined` | Controlled active basemap ID. |
| `onLayerChange` | `(layer: BasemapLayerItem) => void` | `undefined` | Callback fired when a basemap style is selected. |
| `defaultOverlayIds` | `string[]` | `[]` | Initial active overlay IDs. |
| `activeOverlayIds` | `string[]` | `undefined` | Controlled active overlay IDs. |
| `onOverlayChange` | `(activeOverlayIds: string[]) => void` | `undefined` | Callback fired when active overlays change. |
| `position` | `ControlPosition` | `undefined` | Floating map position when rendered as a standalone button. |
| `inNavigator` | `boolean` | `false` | When `true`, embeds seamlessly inside the `MapNavigator` panel. |
| `width` | `number` | `280` | Popover menu width in pixels. |
| `popoverPlacement` | `'left' \| 'right' \| 'top' \| 'bottom' \| 'auto'` | `'right'` | Popover placement relative to the trigger button. |
| `backgroundColor` | `string` | `undefined` | Custom background color. |
| `tooltip` | `string` | `'Basemap & Overlays'` | Tooltip label. |

---

### `<MapAccordion />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` / `label` | `string` | `'TOOLS'` | Text displayed on the collapsed accordion button. |
| `icon` | `ReactNode` | `undefined` | Icon element displayed on the button. |
| `tooltip` | `string` | `undefined` | Tooltip displayed on hover. |
| `position` | `ControlPosition \| 'toolbar'` | `'toolbar'` | Map position. Defaults to mounting inside the Mapixa toolbar. |
| `independent` | `boolean` | `false` | If `true`, does not auto-close when other accordions open. |
| `backgroundColor` | `string` | `undefined` | Custom background color. |
| `footer` | `ReactNode` | `undefined` | Optional footer element rendered at the bottom of the accordion. |

---

### `<MapButton />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `ReactNode` | `undefined` | Button icon component. |
| `tooltip` / `title` | `string` | `undefined` | Accessible tooltip text. |
| `label` | `string` | `undefined` | Optional text label. |
| `active` | `boolean` | `false` | Toggles the active/highlighted visual state. |
| `badge` | `string \| number` | `undefined` | Badge indicator (e.g. dot, count, or text). |
| `disabled` | `boolean` | `false` | Whether the button is disabled. |
| `onClick` | `(event, map) => void` | `undefined` | Click handler. Second argument provides the active `maplibregl.Map` instance! |
| `position` | `ControlPosition` | `undefined` | If specified, renders as a standalone floating button at that position. |
| `backgroundColor` | `string` | `undefined` | Custom background color. |
| `size` | `number` | `36` (accordion) / `32` (standalone) | Custom button dimension in pixels. |

---

## 📄 License

MIT © [Seyed Ali Rafazi](https://github.com/seyedali-rafazi)
