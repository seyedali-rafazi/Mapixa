import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FC,
  type MouseEvent,
} from "react";
import { useMap } from "react-map-gl/maplibre";
import { LayersIcon, CloseIcon, CheckIcon } from "../ui/Icons";
import { Popover } from "../ui/Popover";
import { MapControlBox } from "../MapControlBox";
import { useAccordionContext } from "../../context/AccordionContext";
import { isDarkColor } from "../../utils/colorUtils";
import { toast } from "sonner";
import type {
  BasemapLayerItem,
  BasemapOverlayItem,
  BasemapSwitcherProps,
} from "../../types/basemap";

const DEFAULT_BASEMAPS: BasemapLayerItem[] = [
  {
    id: "positron",
    name: "Light Map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    description: "Clean, light cartography",
  },
  {
    id: "dark-matter",
    name: "Dark Map",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    description: "Sleek, high-contrast dark theme",
  },
  {
    id: "voyager",
    name: "Voyager",
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    description: "Detailed colorful base layer",
  },
  {
    id: "demotiles",
    name: "Demotiles",
    style: "https://demotiles.maplibre.org/style.json",
    description: "Standard MapLibre vector style",
  },
];

export const BasemapSwitcher: FC<BasemapSwitcherProps> = ({
  layer,
  layers,
  overlay,
  overlays,
  defaultLayerId,
  activeLayerId: controlledLayerId,
  onLayerChange,
  defaultOverlayIds = [],
  activeOverlayIds: controlledOverlayIds,
  onOverlayChange,
  position,
  inNavigator = false,
  embedded = false,
  margin,
  icon,
  tooltip = "Basemap & Overlays",
  title = "Basemap & Overlays",
  size,
  width = 310,
  popoverPlacement = "auto",
  backgroundColor,
  color,
  style,
  className = "",
  id,
}) => {
  const { isInAccordion } = useAccordionContext();
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const isEmbeddedInNav = inNavigator || embedded;
  const isStandalone = !isEmbeddedInNav && (Boolean(position) || !isInAccordion);
  const isDark = isDarkColor(backgroundColor);

  // Consolidated lists (supports singular and plural props)
  const effectiveLayers: BasemapLayerItem[] =
    layer && layer.length > 0
      ? layer
      : layers && layers.length > 0
      ? layers
      : DEFAULT_BASEMAPS;

  const effectiveOverlays: BasemapOverlayItem[] =
    overlay && overlay.length > 0
      ? overlay
      : overlays && overlays.length > 0
      ? overlays
      : [];

  // Find default layer from props (default: true) or defaultLayerId
  const layerWithDefault = effectiveLayers.find((l) => l.default);
  const defaultId = defaultLayerId || (layerWithDefault ? layerWithDefault.id : null);

  // Active layer state: null by default if not specified (all deactive)
  const [internalLayerId, setInternalLayerId] = useState<string | null>(
    (map as any)?._mapixaActiveLayerId ?? defaultId
  );
  const activeLayerId = controlledLayerId !== undefined ? controlledLayerId : internalLayerId;

  // Active overlays state: default to any overlay with default: true or defaultOverlayIds
  const defaultOverlayIdsFromProps = effectiveOverlays
    .filter((ov) => ov.default)
    .map((ov) => ov.id);

  const initialOverlayIds =
    defaultOverlayIds && defaultOverlayIds.length > 0
      ? defaultOverlayIds
      : defaultOverlayIdsFromProps;

  const [internalOverlayIds, setInternalOverlayIds] = useState<string[]>(
    (map as any)?._mapixaActiveOverlayIds ?? initialOverlayIds
  );
  const activeOverlayIds = controlledOverlayIds !== undefined ? controlledOverlayIds : internalOverlayIds;

  // Overlay opacities map (overlay id -> opacity 0.0 to 1.0)
  const [overlayOpacities, setOverlayOpacities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const ov of effectiveOverlays) {
      initial[ov.id] = ov.opacity ?? 1;
    }
    return initial;
  });

  // UI state: Popover anchor and Tab
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<"layers" | "overlays">("layers");

  // Keep ref of active overlays & opacities for style.load re-application
  const activeOverlayIdsRef = useRef(activeOverlayIds);
  activeOverlayIdsRef.current = activeOverlayIds;

  const overlayOpacitiesRef = useRef(overlayOpacities);
  overlayOpacitiesRef.current = overlayOpacities;

  const effectiveOverlaysRef = useRef(effectiveOverlays);
  effectiveOverlaysRef.current = effectiveOverlays;

  // Helper: Apply a single overlay to the map
  const applyOverlay = useCallback(
    async (ov: BasemapOverlayItem, opacity: number) => {
      if (!map || !map.isStyleLoaded()) return;

      const prefix = `mlt-ovl-${ov.id}`;
      const srcId = `${prefix}-source`;
      const lyrId = `${prefix}-layer`;

      try {
        // Case 1: Custom source and layers provided
        if (ov.source && ov.layers) {
          if (!map.getSource(srcId)) {
            map.addSource(srcId, ov.source);
          }
          for (const l of ov.layers) {
            const dynamicLyrId = `${prefix}-${l.id}`;
            if (!map.getLayer(dynamicLyrId)) {
              map.addLayer({ ...l, id: dynamicLyrId, source: srcId });
            }
          }
          return;
        }

        // Case 2: Style is string
        if (typeof ov.style === "string") {
          const styleUrl = ov.style.trim();
          const isTileUrl =
            styleUrl.includes("{z}") ||
            styleUrl.endsWith(".png") ||
            styleUrl.endsWith(".jpg") ||
            styleUrl.endsWith(".webp");

          if (isTileUrl) {
            // Raster tile template
            if (!map.getSource(srcId)) {
              map.addSource(srcId, {
                type: "raster",
                tiles: [styleUrl],
                tileSize: 256,
              });
            }
            if (!map.getLayer(lyrId)) {
              map.addLayer({
                id: lyrId,
                type: "raster",
                source: srcId,
                paint: {
                  "raster-opacity": opacity,
                },
              });
            }
          } else if (styleUrl.endsWith(".json") || styleUrl.includes("/style")) {
            // Style JSON URL: fetch and import sources & layers
            const response = await fetch(styleUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const styleJson = await response.json();

            if (styleJson.sources) {
              for (const [key, spec] of Object.entries(styleJson.sources)) {
                const sId = `${prefix}-${key}`;
                if (!map.getSource(sId)) {
                  map.addSource(sId, spec as any);
                }
              }
            }

            if (styleJson.layers && Array.isArray(styleJson.layers)) {
              for (const layerDef of styleJson.layers) {
                const lId = `${prefix}-${layerDef.id}`;
                if (!map.getLayer(lId)) {
                  const copy = { ...layerDef, id: lId };
                  if (copy.source && styleJson.sources?.[copy.source]) {
                    copy.source = `${prefix}-${copy.source}`;
                  }
                  map.addLayer(copy);
                }
              }
            }
          } else {
            // Fallback to raster tile URL
            if (!map.getSource(srcId)) {
              map.addSource(srcId, {
                type: "raster",
                tiles: [styleUrl],
                tileSize: 256,
              });
            }
            if (!map.getLayer(lyrId)) {
              map.addLayer({
                id: lyrId,
                type: "raster",
                source: srcId,
                paint: {
                  "raster-opacity": opacity,
                },
              });
            }
          }
          return;
        }

        // Case 3: Style is object with sources & layers
        if (ov.style && typeof ov.style === "object") {
          const spec = ov.style;
          if (spec.sources) {
            for (const [key, sSpec] of Object.entries(spec.sources)) {
              const sId = `${prefix}-${key}`;
              if (!map.getSource(sId)) {
                map.addSource(sId, sSpec as any);
              }
            }
          }
          if (spec.layers && Array.isArray(spec.layers)) {
            for (const layerDef of spec.layers) {
              const lId = `${prefix}-${layerDef.id}`;
              if (!map.getLayer(lId)) {
                const copy = { ...layerDef, id: lId };
                if (copy.source && spec.sources?.[copy.source]) {
                  copy.source = `${prefix}-${copy.source}`;
                }
                map.addLayer(copy);
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`Failed to load overlay "${ov.name}":`, err);
        toast.error(`Failed to load overlay: ${ov.name}`);
      }
    },
    [map]
  );

  // Helper: Remove a single overlay from the map
  const removeOverlay = useCallback(
    (ovId: string) => {
      if (!map) return;
      const prefix = `mlt-ovl-${ovId}`;

      try {
        const styleObj = map.getStyle();
        if (styleObj && styleObj.layers) {
          // Remove layers
          for (const l of styleObj.layers) {
            if (l.id.startsWith(prefix)) {
              map.removeLayer(l.id);
            }
          }
        }
        if (styleObj && styleObj.sources) {
          // Remove sources
          for (const s of Object.keys(styleObj.sources)) {
            if (s.startsWith(prefix)) {
              map.removeSource(s);
            }
          }
        }
      } catch (err) {
        console.warn(`Error removing overlay ${ovId}:`, err);
      }
    },
    [map]
  );

  // Re-apply all active overlays (e.g. after style.load or active change)
  const refreshActiveOverlays = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    for (const ov of effectiveOverlaysRef.current) {
      const isActive = activeOverlayIdsRef.current.includes(ov.id);
      if (isActive) {
        const opacity = overlayOpacitiesRef.current[ov.id] ?? 1;
        applyOverlay(ov, opacity);
      } else {
        removeOverlay(ov.id);
      }
    }
  }, [map, applyOverlay, removeOverlay]);

  // Listen to style.load to restore active overlays when base map changes
  useEffect(() => {
    if (!map) return;

    const handleStyleLoad = () => {
      refreshActiveOverlays();
    };

    if (map.isStyleLoaded()) {
      refreshActiveOverlays();
    }

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [map, refreshActiveOverlays]);

  // Apply default layer style to map on mount if specified
  const appliedDefaultLayerRef = useRef(false);

  useEffect(() => {
    if (!map || appliedDefaultLayerRef.current) return;
    if (!defaultId) return;

    const layerToApply = effectiveLayers.find((l) => l.id === defaultId);
    if (!layerToApply) return;

    appliedDefaultLayerRef.current = true;

    const applyDefaultStyle = () => {
      try {
        if ((map as any)._mapixaCurrentStyle === layerToApply.style) return;
        (map as any)._mapixaCurrentStyle = layerToApply.style;
        (map as any)._mapixaActiveLayerId = layerToApply.id;
        map.setStyle(layerToApply.style);
      } catch (err) {
        console.warn("Could not apply default basemap style:", err);
      }
    };

    if (map.loaded() || map.isStyleLoaded()) {
      applyDefaultStyle();
    } else {
      map.once("load", applyDefaultStyle);
    }
  }, [map, defaultId, effectiveLayers]);

  // Sync state between multiple BasemapSwitcher instances on the same map
  useEffect(() => {
    if (!map) return;

    const handleBasemapChange = (e: any) => {
      if (e && e.layerId !== undefined) {
        setInternalLayerId(e.layerId);
      }
    };

    const handleOverlayChange = (e: any) => {
      if (e && e.overlayIds) {
        setInternalOverlayIds(e.overlayIds);
      }
    };

    map.on("mlt:basemapchange", handleBasemapChange);
    map.on("mlt:overlaychange", handleOverlayChange);

    return () => {
      map.off("mlt:basemapchange", handleBasemapChange);
      map.off("mlt:overlaychange", handleOverlayChange);
    };
  }, [map]);

  // Handle switching basemap layer
  const handleSelectLayer = (selected: BasemapLayerItem) => {
    if (!map) return;
    if (selected.id === activeLayerId) return;

    if (controlledLayerId === undefined) {
      setInternalLayerId(selected.id);
    }
    (map as any)._mapixaCurrentStyle = selected.style;
    (map as any)._mapixaActiveLayerId = selected.id;
    map.fire("mlt:basemapchange", { layerId: selected.id, layer: selected });

    onLayerChange?.(selected);

    try {
      map.setStyle(selected.style);
      toast.success(`Switched basemap: ${selected.name}`);
    } catch (err: any) {
      console.error("Failed to set map style:", err);
      toast.error(`Failed to switch to ${selected.name}`);
    }
  };

  // Handle toggling overlay
  const handleToggleOverlay = (ov: BasemapOverlayItem) => {
    const isCurrentlyActive = activeOverlayIds.includes(ov.id);
    let nextIds: string[];

    if (isCurrentlyActive) {
      nextIds = activeOverlayIds.filter((id) => id !== ov.id);
      removeOverlay(ov.id);
      toast.info(`Disabled overlay: ${ov.name}`);
    } else {
      nextIds = [...activeOverlayIds, ov.id];
      const opacity = overlayOpacities[ov.id] ?? 1;
      applyOverlay(ov, opacity);
      toast.success(`Enabled overlay: ${ov.name}`);
    }

    if (controlledOverlayIds === undefined) {
      setInternalOverlayIds(nextIds);
    }
    (map as any)._mapixaActiveOverlayIds = nextIds;
    map.fire("mlt:overlaychange", { overlayIds: nextIds });
    onOverlayChange?.(nextIds);
  };

  // Handle opacity slider change
  const handleOpacityChange = (ovId: string, value: number) => {
    setOverlayOpacities((prev) => ({ ...prev, [ovId]: value }));

    if (!map) return;
    const prefix = `mlt-ovl-${ovId}`;
    try {
      const styleObj = map.getStyle();
      if (styleObj && styleObj.layers) {
        for (const lyr of styleObj.layers) {
          if (lyr.id.startsWith(prefix)) {
            if (lyr.type === "raster") {
              map.setPaintProperty(lyr.id, "raster-opacity", value);
            } else if (lyr.type === "line") {
              map.setPaintProperty(lyr.id, "line-opacity", value);
            } else if (lyr.type === "fill") {
              map.setPaintProperty(lyr.id, "fill-opacity", value);
            } else if (lyr.type === "circle") {
              map.setPaintProperty(lyr.id, "circle-opacity", value);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not update layer opacity:", err);
    }
  };

  const handleClickTrigger = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const buttonSize = size ?? (isInAccordion ? 36 : 32);

  const buttonElement = (
    <button
      id={id}
      type="button"
      className={`mlt-icon-btn ${open ? "active mlt-icon-btn-active" : ""} ${className}`.trim()}
      style={{
        width: buttonSize,
        height: buttonSize,
        position: "relative",
        ...(color ? { color } : {}),
        ...(!isStandalone ? style : {}),
      }}
      onClick={handleClickTrigger}
      title={tooltip}
      aria-label={tooltip}
    >
      {icon ?? <LayersIcon size={isInAccordion ? 18 : 16} />}
      {activeOverlayIds.length > 0 && (
        <span
          className="mlt-button-badge"
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            background: "#2563eb",
            color: "#ffffff",
            fontSize: "9px",
            width: 14,
            height: 14,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {activeOverlayIds.length}
        </span>
      )}
    </button>
  );

  const popoverContent = (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      width={width}
      placement={popoverPlacement}
      backgroundColor={backgroundColor}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "4px",
            borderBottom: "1px solid var(--mlt-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <LayersIcon size={16} style={{ color: "#2563eb" }} />
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{title}</span>
          </div>
          <button
            type="button"
            className="mlt-icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={handleClose}
            title="Close"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Tab switcher if overlays exist */}
        {effectiveOverlays.length > 0 && (
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              borderRadius: "8px",
              padding: "2px",
              gap: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("layers")}
              style={{
                flex: 1,
                padding: "4px 8px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: activeTab === "layers" ? "#ffffff" : "transparent",
                color: activeTab === "layers" ? "#1d1d1f" : "var(--mlt-text-muted)",
                boxShadow:
                  activeTab === "layers"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
                transition: "all 0.15s ease",
              }}
            >
              Base Maps ({effectiveLayers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("overlays")}
              style={{
                flex: 1,
                padding: "4px 8px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: activeTab === "overlays" ? "#ffffff" : "transparent",
                color: activeTab === "overlays" ? "#1d1d1f" : "var(--mlt-text-muted)",
                boxShadow:
                  activeTab === "overlays"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
                transition: "all 0.15s ease",
              }}
            >
              Overlays ({activeOverlayIds.length}/{effectiveOverlays.length})
            </button>
          </div>
        )}

        {/* Tab 1: Base Maps Grid */}
        {(activeTab === "layers" || effectiveOverlays.length === 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
              }}
            >
              {effectiveLayers.map((l) => {
                const isCurrent = l.id === activeLayerId;
                const isDarkCard = l.id.toLowerCase().includes("dark");

                return (
                  <div
                    key={l.id}
                    onClick={() => handleSelectLayer(l)}
                    style={{
                      position: "relative",
                      borderRadius: "8px",
                      padding: "8px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      border: isCurrent
                        ? "2px solid #2563eb"
                        : "1px solid var(--mlt-border)",
                      backgroundColor: isCurrent
                        ? "rgba(37, 99, 235, 0.08)"
                        : "rgba(0, 0, 0, 0.02)",
                      transition: "all 0.15s ease",
                      boxShadow: isCurrent ? "0 2px 8px rgba(37, 99, 235, 0.15)" : "none",
                    }}
                  >
                    {/* Visual Card Thumbnail / Gradient */}
                    <div
                      style={{
                        width: "100%",
                        height: 52,
                        borderRadius: "5px",
                        background: l.thumbnail
                          ? `url(${l.thumbnail}) center/cover no-repeat`
                          : isDarkCard
                          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                          : "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%)",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* Fake mini map grid lines */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0.2,
                          backgroundImage:
                            "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
                          backgroundSize: "12px 12px",
                        }}
                      />
                      {l.icon ? (
                        l.icon
                      ) : (
                        <LayersIcon
                          size={18}
                          style={{
                            color: isDarkCard ? "#94a3b8" : "#64748b",
                            position: "relative",
                          }}
                        />
                      )}

                      {/* Active Checkmark Pill */}
                      {isCurrent && (
                        <div
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "#2563eb",
                            borderRadius: "50%",
                            width: 16,
                            height: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                          }}
                        >
                          <CheckIcon size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? "#2563eb" : "var(--mlt-text)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {l.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Overlays List */}
        {activeTab === "overlays" && effectiveOverlays.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {effectiveOverlays.map((ov) => {
              const isChecked = activeOverlayIds.includes(ov.id);
              const opacity = overlayOpacities[ov.id] ?? 1;

              return (
                <div
                  key={ov.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "8px",
                    borderRadius: "8px",
                    border: isChecked
                      ? "1px solid rgba(37, 99, 235, 0.4)"
                      : "1px solid var(--mlt-border)",
                    backgroundColor: isChecked
                      ? "rgba(37, 99, 235, 0.04)"
                      : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                    onClick={() => handleToggleOverlay(ov)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {ov.icon}
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: isChecked ? 600 : 500,
                            color: isChecked ? "#2563eb" : "var(--mlt-text)",
                          }}
                        >
                          {ov.name}
                        </div>
                        {ov.description && (
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--mlt-text-muted)",
                            }}
                          >
                            {ov.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by container click
                      style={{ cursor: "pointer", accentColor: "#2563eb", width: 16, height: 16 }}
                    />
                  </div>

                  {/* Opacity slider when enabled */}
                  {isChecked && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        paddingTop: "4px",
                        borderTop: "1px dashed var(--mlt-border)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--mlt-text-muted)",
                          minWidth: 42,
                        }}
                      >
                        Opacity:
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(e) =>
                          handleOpacityChange(ov.id, parseFloat(e.target.value))
                        }
                        style={{
                          flex: 1,
                          cursor: "pointer",
                          accentColor: "#2563eb",
                          height: "4px",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--mlt-text-muted)",
                          minWidth: 32,
                          textAlign: "right",
                        }}
                      >
                        {Math.round(opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Popover>
  );

  // Standalone floating position (like fullscreen button)
  if (isStandalone) {
    return (
      <>
        <MapControlBox position={position ?? "bottom-right"} margin={margin}>
          <div
            className={`mlt-panel mlt-view-control ${isDark ? "mlt-dark" : ""}`.trim()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "4px",
              width: "fit-content",
              ...(backgroundColor ? { background: backgroundColor } : {}),
              ...style,
            }}
          >
            {buttonElement}
          </div>
        </MapControlBox>
        {popoverContent}
      </>
    );
  }

  // Inside navigation bar or accordion
  return (
    <>
      {buttonElement}
      {popoverContent}
    </>
  );
};

export default BasemapSwitcher;
