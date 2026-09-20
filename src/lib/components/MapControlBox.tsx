import { useControl } from "react-map-gl/maplibre";
import type { ControlPosition } from "react-map-gl/maplibre";
import { createPortal } from "react-dom";
import { useRef, useState, useEffect, type ReactNode } from "react";

class ControlBoxHandler {
  _position: ControlPosition;
  _margin: { top: number; bottom: number; left: number; right: number };
  _container: HTMLElement | null;
  _map: any;

  constructor(
    position: ControlPosition,
    margin: { top: number; bottom: number; left: number; right: number }
  ) {
    this._position = position;
    this._margin = margin;
    this._container = null;
  }

  onAdd(map: any) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl mapboxgl-ctrl";

    const { top, bottom, left, right } = this._margin;
    const pos = this._position;

    const marginStyles: Record<string, string> = {
      "top-left": `margin: ${top}px 0 0 ${left}px;`,
      "top-right": `margin: ${top}px ${right}px 0 0;`,
      "bottom-left": `margin: 0 0 ${bottom}px ${left}px;`,
      "bottom-right": `margin: 0 ${right}px ${bottom}px 0;`,
    };

    this._container.style.cssText = `
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0;
      pointer-events: auto;
      ${marginStyles[pos] ?? "margin: 10px;"}
    `;

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = undefined;
  }

  getDefaultPosition(): ControlPosition {
    return this._position;
  }

  getContainer(): HTMLElement | null {
    return this._container;
  }
}

export interface MapControlBoxProps {
  position?: ControlPosition;
  margin?: { top: number; bottom: number; left: number; right: number };
  children?: ReactNode;
}

export function MapControlBox({
  position = "top-right",
  margin = { top: 10, bottom: 10, left: 10, right: 10 },
  children,
}: MapControlBoxProps) {
  const controlRef = useRef<ControlBoxHandler | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  if (!controlRef.current) {
    controlRef.current = new ControlBoxHandler(position, margin);
  }

  useControl(() => controlRef.current!, { position });

  useEffect(() => {
    const ctrl = controlRef.current;
    if (ctrl) {
      setContainer(ctrl.getContainer());
    }
  }, []);

  if (!container) return null;

  return createPortal(children, container);
}

export default MapControlBox;
