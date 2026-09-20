import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";

/**
 * Automatically debounces resize calls to MapLibre when browser/container size changes
 */
export function MapResizeHandler() {
  const { current: mapRef } = useMap();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const scheduleResize = () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        if (!map._removed && map.getContainer()) {
          map.resize();
        }
        debounceRef.current = null;
      }, 150);
    };

    window.addEventListener("resize", scheduleResize);

    return () => {
      window.removeEventListener("resize", scheduleResize);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [mapRef]);

  return null;
}

export default MapResizeHandler;
