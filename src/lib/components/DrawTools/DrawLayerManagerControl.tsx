import {
  useState,
  useRef,
  type FC,
  type MouseEvent,
  type DragEvent,
} from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Locate,
  Edit2,
  Check,
  X,
  Square,
  Circle,
  Hexagon,
  Route,
  Pencil,
  MapPin,
  GitFork,
} from "lucide-react";
import { useDrawLayers } from "../../context/DrawLayersContext";
import { Popover } from "../ui/Popover";
import type { DrawnLayerItem, DrawnToolType, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface DrawLayerManagerControlProps {
  config?: ToolConfig;
}

const getToolIcon = (tool: DrawnToolType) => {
  switch (tool) {
    case "rectangle":
      return Square;
    case "circle":
      return Circle;
    case "polygon":
      return Hexagon;
    case "line":
      return Route;
    case "freedraw":
      return Pencil;
    case "marker":
      return MapPin;
    case "intersection":
      return GitFork;
    default:
      return Square;
  }
};

const getLayerColor = (layer: DrawnLayerItem): string => {
  return (
    layer.properties?.fillColor ||
    layer.properties?.outlineColor ||
    layer.properties?.lineColor ||
    layer.properties?.color ||
    "#007aff"
  );
};

export const DrawLayerManagerControl: FC<DrawLayerManagerControlProps> = () => {
  const {
    drawnLayers,
    removeDrawnLayer,
    reorderDrawnLayers,
    toggleLayerVisibility,
    setAllDrawnLayersVisibility,
    zoomToLayer,
    clearAllDrawnLayers,
    updateDrawnLayer,
  } = useDrawLayers();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const open = Boolean(anchorEl);

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setEditingId(null);
  };

  // Convert array to display order:
  // Top of UI list = topmost layer on map (drawn last in MapLibre = highest array index)
  // Bottom of UI list = bottom layer on map (drawn first in MapLibre = lowest array index)
  // Let displayList = drawnLayers reversed, so index 0 in displayList is drawnLayers[drawnLayers.length - 1]
  const displayItems = [...drawnLayers].reverse().map((layer, displayIdx) => ({
    layer,
    displayIdx,
    actualIdx: drawnLayers.length - 1 - displayIdx,
  }));

  // Reordering functions
  const handleMoveUpInList = (actualIdx: number) => {
    // In UI list, "Moving Up" means moving towards the top of the list,
    // which corresponds to a HIGHER index in drawnLayers (drawn on top)!
    if (actualIdx >= drawnLayers.length - 1) return;
    reorderDrawnLayers(actualIdx, actualIdx + 1);
  };

  const handleMoveDownInList = (actualIdx: number) => {
    // In UI list, "Moving Down" means moving towards the bottom of the list,
    // which corresponds to a LOWER index in drawnLayers (drawn underneath)!
    if (actualIdx <= 0) return;
    reorderDrawnLayers(actualIdx, actualIdx - 1);
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, actualIdx: number) => {
    setDraggedIndex(actualIdx);
    e.dataTransfer.effectAllowed = "move";
    // Set transparent ghost drag image or standard drag
    try {
      e.dataTransfer.setData("text/plain", `${actualIdx}`);
    } catch {
      // ignore
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, actualIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== actualIdx) {
      setDragOverIndex(actualIdx);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetActualIdx: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetActualIdx) {
      reorderDrawnLayers(draggedIndex, targetActualIdx);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const startRename = (layer: DrawnLayerItem) => {
    setEditingId(layer.id);
    setEditingName(layer.name || "");
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      updateDrawnLayer(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  const allVisible =
    drawnLayers.length > 0 && drawnLayers.every((l) => l.visible !== false);

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${open ? "mlt-icon-btn-active" : ""}`}
        onClick={handleClick}
        title={`Draw Layers Manager (${drawnLayers.length})`}
        style={{ position: "relative" }}
      >
        <Layers size={18} />
        {drawnLayers.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              backgroundColor: "var(--mlt-primary, #007aff)",
              color: "#fff",
              borderRadius: "999px",
              minWidth: 15,
              height: 15,
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 2px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          >
            {drawnLayers.length}
          </span>
        )}
      </button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        width={340}
        placement="auto"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "100%", overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={16} color="var(--mlt-primary, #007aff)" />
              <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                Draw Layers
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--mlt-text-secondary)",
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontWeight: 600,
                }}
              >
                {drawnLayers.length}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {drawnLayers.length > 0 && (
                <button
                  type="button"
                  className="mlt-btn mlt-btn-secondary"
                  onClick={() => setAllDrawnLayersVisibility(!allVisible)}
                  style={{ fontSize: "0.7rem", padding: "2px 7px" }}
                  title={allVisible ? "Hide all layers" : "Show all layers"}
                >
                  {allVisible ? "Hide All" : "Show All"}
                </button>
              )}
              <button
                type="button"
                className="mlt-icon-btn"
                style={{ width: 22, height: 22 }}
                onClick={handleClose}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "var(--mlt-border, rgba(0,0,0,0.08))",
            }}
          />

          {/* Hint regarding z-index order */}
          {drawnLayers.length > 1 && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--mlt-text-secondary)",
                display: "flex",
                justifyContent: "space-between",
                padding: "0 2px",
                lineHeight: 1.2,
              }}
            >
              <span>↑ Top layer on map</span>
              <span>Drag or use arrows to reorder z-index</span>
            </div>
          )}

          {/* Empty State */}
          {drawnLayers.length === 0 ? (
            <div
              style={{
                padding: "24px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 8,
                color: "var(--mlt-text-secondary)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 122, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mlt-primary, #007aff)",
                }}
              >
                <Layers size={22} />
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                No Drawn Layers
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  lineHeight: 1.4,
                  maxWidth: 240,
                }}
              >
                Draw rectangles, circles, lines, or polygons using the tools above.
                They will appear here to manage, reorder, and hide/show.
              </p>
            </div>
          ) : (
            /* Layers List */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: "min(340px, calc(100vh - 240px))",
                overflowY: "auto",
                paddingRight: 4,
                flex: 1,
                minHeight: 60,
              }}
            >
              {displayItems.map(({ layer, displayIdx, actualIdx }) => {
                const ToolIcon = getToolIcon(layer.tool);
                const color = getLayerColor(layer);
                const isHidden = layer.visible === false;
                const isEditing = editingId === layer.id;
                const isDragging = draggedIndex === actualIdx;
                const isDragTarget =
                  dragOverIndex === actualIdx && draggedIndex !== actualIdx;

                return (
                  <div
                    key={layer.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, actualIdx)}
                    onDragOver={(e) => handleDragOver(e, actualIdx)}
                    onDrop={(e) => handleDrop(e, actualIdx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 8px",
                      borderRadius: "8px",
                      backgroundColor: isHidden
                        ? "rgba(0, 0, 0, 0.02)"
                        : isDragTarget
                        ? "rgba(0, 122, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.04)",
                      border: isDragTarget
                        ? "1px dashed var(--mlt-primary, #007aff)"
                        : "1px solid transparent",
                      opacity: isDragging ? 0.4 : isHidden ? 0.6 : 1,
                      transition: "all 0.15s ease",
                      cursor: "grab",
                    }}
                  >
                    {/* Drag Handle & Order Indicators */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "var(--mlt-text-secondary)",
                      }}
                      title="Drag to reorder layer z-index"
                    >
                      <GripVertical size={14} style={{ opacity: 0.6 }} />
                    </div>

                    {/* Move Up/Down Arrow buttons for accessibility */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <button
                        type="button"
                        disabled={displayIdx === 0}
                        onClick={() => handleMoveUpInList(actualIdx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: displayIdx === 0 ? "default" : "pointer",
                          opacity: displayIdx === 0 ? 0.2 : 0.7,
                          color: "var(--mlt-text)",
                          display: "flex",
                        }}
                        title="Move layer towards top"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={displayIdx === displayItems.length - 1}
                        onClick={() => handleMoveDownInList(actualIdx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor:
                            displayIdx === displayItems.length - 1
                              ? "default"
                              : "pointer",
                          opacity:
                            displayIdx === displayItems.length - 1 ? 0.2 : 0.7,
                          color: "var(--mlt-text)",
                          display: "flex",
                        }}
                        title="Move layer towards bottom"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {/* Color Swatch & Shape Type Icon */}
                    <div
                      style={{
                        position: "relative",
                        width: 24,
                        height: 24,
                        borderRadius: "6px",
                        backgroundColor: `${color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: `1.5px solid ${color}`,
                      }}
                    >
                      <ToolIcon size={13} color={color} />
                    </div>

                    {/* Title & Metrics */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                      }}
                    >
                      {isEditing ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(layer.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            style={{
                              fontSize: "0.78rem",
                              padding: "2px 4px",
                              borderRadius: "4px",
                              border: "1px solid var(--mlt-primary, #007aff)",
                              width: "100%",
                              outline: "none",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(layer.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 2,
                              color: "var(--mlt-primary, #007aff)",
                            }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span
                            onDoubleClick={() => startRename(layer)}
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: isHidden
                                ? "var(--mlt-text-secondary)"
                                : "var(--mlt-text)",
                            }}
                            title={`${layer.name} (Double-click to rename)`}
                          >
                            {layer.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => startRename(layer)}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              opacity: 0.35,
                              display: "inline-flex",
                            }}
                            title="Rename layer"
                          >
                            <Edit2 size={10} />
                          </button>
                        </div>
                      )}

                      {/* Metrics badge */}
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--mlt-text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ textTransform: "capitalize" }}>
                          {layer.tool}
                        </span>
                        {layer.metrics?.areaSqKm && (
                          <span>• {layer.metrics.areaSqKm} km²</span>
                        )}
                        {layer.metrics?.radiusKm && (
                          <span>• r: {layer.metrics.radiusKm} km</span>
                        )}
                        {layer.metrics?.distanceKm && (
                          <span>• {layer.metrics.distanceKm} km</span>
                        )}
                      </span>
                    </div>

                    {/* Action Buttons: Zoom, Hide/Show, Delete */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexShrink: 0,
                      }}
                    >
                      {/* Zoom to layer */}
                      <button
                        type="button"
                        className="mlt-icon-btn"
                        style={{ width: 24, height: 24 }}
                        onClick={() => zoomToLayer(layer.id)}
                        title="Zoom to this layer"
                      >
                        <Locate size={13} />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        className="mlt-icon-btn"
                        style={{ width: 24, height: 24 }}
                        onClick={() => toggleLayerVisibility(layer.id)}
                        title={isHidden ? "Show layer" : "Hide layer"}
                      >
                        {isHidden ? (
                          <EyeOff
                            size={14}
                            color="var(--mlt-text-secondary)"
                          />
                        ) : (
                          <Eye size={14} color="var(--mlt-primary, #007aff)" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        className="mlt-icon-btn"
                        style={{ width: 24, height: 24 }}
                        onClick={() => {
                          removeDrawnLayer(layer.id);
                          toast.info(`Deleted ${layer.name}`);
                        }}
                        title="Delete layer"
                      >
                        <Trash2 size={13} color="var(--mlt-danger, #ff3b30)" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer with Clear All */}
          {drawnLayers.length > 0 && (
            <>
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "var(--mlt-border, rgba(0,0,0,0.08))",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--mlt-text-secondary)",
                  }}
                >
                  {drawnLayers.filter((l) => l.visible !== false).length} visible
                  of {drawnLayers.length} total
                </span>
                <button
                  type="button"
                  className="mlt-btn mlt-btn-danger"
                  style={{ fontSize: "0.7rem", padding: "3px 8px" }}
                  onClick={() => {
                    clearAllDrawnLayers();
                  }}
                >
                  <Trash2 size={12} style={{ marginRight: 4 }} />
                  Clear All
                </button>
              </div>
            </>
          )}
        </div>
      </Popover>
    </>
  );
};

export default DrawLayerManagerControl;
