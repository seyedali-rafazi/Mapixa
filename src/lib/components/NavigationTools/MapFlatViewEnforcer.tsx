import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

/**
 * Enforces flat 2D Mercator view on the MapLibre map instance (no pitch/bearing tilt)
 */
export function MapFlatViewEnforcer() {
  const { current } = useMap();

  useEffect(() => {
    const map = current?.getMap();
    if (!map) return;

    const enforceFlatView = () => {
      try {
        (map as any).setProjection?.("mercator");
      } catch {
        // Projection API varies between MapLibre versions
      }

      map.setPitch(0);
      map.setBearing(0);
      map.dragRotate?.disable();
      map.touchPitch?.disable();
    };

    enforceFlatView();
    map.on("style.load", enforceFlatView);

    return () => {
      map.off("style.load", enforceFlatView);
    };
  }, [current]);

  return null;
}

export default MapFlatViewEnforcer;
