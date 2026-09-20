import { useState, useEffect, type FC } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useExclusiveTool, useMapTool } from "../../context/MapToolContext";
import { Modal } from "../ui/Modal";
import { CropIcon, DownloadIcon } from "../ui/Icons";
import ExtraActionButtons from "../ExtraActionButtons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface CaptureAreaControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const CaptureAreaControl: FC<CaptureAreaControlProps> = ({
  config,
  extraActions: propExtraActions,
}) => {
  const [isActive, setIsActive] = useExclusiveTool("capture");
  const { onDrawEnd, extraActions: contextExtraActions } = useMapTool();

  const [modalOpen, setModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("map-screenshot");

  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();

  const mergedActions = propExtraActions || config?.extraActions || contextExtraActions;

  useEffect(() => {
    if (!map || !isActive) return;

    if (map.dragPan) map.dragPan.disable();
    if (map.touchZoomRotate) map.touchZoomRotate.disable();
    map.getCanvas().style.cursor = "crosshair";

    let isDragging = false;
    let startPoint: any = null;
    let boxElement: HTMLDivElement | null = null;

    const onDragStart = (e: any) => {
      if (e.type === "mousedown" && e.originalEvent.button !== 0) return;
      e.preventDefault();
      e.originalEvent.stopPropagation();

      isDragging = true;
      startPoint = e.point;

      boxElement = document.createElement("div");
      Object.assign(boxElement.style, {
        position: "absolute",
        border: "2px dashed #ff2d55",
        backgroundColor: "rgba(255, 45, 85, 0.18)",
        zIndex: "9999",
        pointerEvents: "none",
      });
      map.getCanvasContainer().appendChild(boxElement);
    };

    const onDragMove = (e: any) => {
      if (!isDragging || !boxElement) return;
      e.preventDefault();
      e.originalEvent.stopPropagation();

      const currentPoint = e.point;
      const minX = Math.min(startPoint.x, currentPoint.x);
      const maxX = Math.max(startPoint.x, currentPoint.x);
      const minY = Math.min(startPoint.y, currentPoint.y);
      const maxY = Math.max(startPoint.y, currentPoint.y);

      boxElement.style.left = `${minX}px`;
      boxElement.style.top = `${minY}px`;
      boxElement.style.width = `${maxX - minX}px`;
      boxElement.style.height = `${maxY - minY}px`;
    };

    const onDragEnd = (e: any) => {
      if (!isDragging) return;
      isDragging = false;

      let rectData: any = null;
      if (boxElement && boxElement.parentNode) {
        const currentPoint = e.point || startPoint;
        const minX = Math.min(startPoint.x, currentPoint.x);
        const maxX = Math.max(startPoint.x, currentPoint.x);
        const minY = Math.min(startPoint.y, currentPoint.y);
        const maxY = Math.max(startPoint.y, currentPoint.y);

        const width = maxX - minX;
        const height = maxY - minY;

        boxElement.parentNode.removeChild(boxElement);
        boxElement = null;

        if (width > 20 && height > 20) {
          rectData = { x: minX, y: minY, width, height };
        }
      }

      map.dragPan?.enable();
      map.touchZoomRotate?.enable();
      map.getCanvas().style.cursor = "";
      setIsActive(false);

      if (rectData) {
        map.once("render", () => {
          captureCanvas(rectData);
        });
        map.triggerRepaint();
      }
    };

    const captureCanvas = (rect: { x: number; y: number; width: number; height: number }) => {
      const canvas = map.getCanvas();
      const pixelRatio = window.devicePixelRatio || 1;

      const scaledRect = {
        x: rect.x * pixelRatio,
        y: rect.y * pixelRatio,
        width: rect.width * pixelRatio,
        height: rect.height * pixelRatio,
      };

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = scaledRect.width;
      cropCanvas.height = scaledRect.height;
      const ctx = cropCanvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(
          canvas,
          scaledRect.x,
          scaledRect.y,
          scaledRect.width,
          scaledRect.height,
          0,
          0,
          scaledRect.width,
          scaledRect.height
        );
        const dataUrl = cropCanvas.toDataURL("image/png");
        setCapturedImage(dataUrl);
        setModalOpen(true);

        onDrawEnd?.({
          id: `capture-${Date.now()}`,
          tool: "capture",
          feature: {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [] },
            properties: { ...rect },
          },
          coordinates: rect,
          properties: { ...rect },
        });

        toast.success("Area snapshot captured");
      }
    };

    map.on("mousedown", onDragStart);
    map.on("mousemove", onDragMove);
    map.on("mouseup", onDragEnd);

    return () => {
      map.off("mousedown", onDragStart);
      map.off("mousemove", onDragMove);
      map.off("mouseup", onDragEnd);
      if (boxElement && boxElement.parentNode) {
        boxElement.parentNode.removeChild(boxElement);
      }
      map.dragPan?.enable();
      map.touchZoomRotate?.enable();
      map.getCanvas().style.cursor = "";
    };
  }, [map, isActive, setIsActive, onDrawEnd]);

  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement("a");
    a.href = capturedImage;
    a.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setModalOpen(false);
    toast.success("Image downloaded");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${isActive ? "mlt-icon-btn-active" : ""}`}
        onClick={() => setIsActive(!isActive)}
        title={
          isActive
            ? "Click and drag to select area to capture"
            : "Capture Map Area (Screenshot)"
        }
      >
        <CropIcon size={18} />
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Area Snapshot Preview"
        footer={
          <div className="mlt-modal-footer">
            <button
              type="button"
              className="mlt-btn mlt-btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mlt-btn mlt-btn-primary"
              onClick={handleDownload}
            >
              <DownloadIcon size={14} /> Download PNG
            </button>
          </div>
        }
      >
        {capturedImage && (
          <div
            style={{
              width: "100%",
              maxHeight: "300px",
              overflow: "hidden",
              borderRadius: "10px",
              border: "1px solid var(--mlt-border)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.03)",
              marginBottom: "12px",
            }}
          >
            <img
              src={capturedImage}
              alt="Captured Map Area"
              style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }}
            />
          </div>
        )}

        <div className="mlt-form-group">
          <label className="mlt-label">File Name</label>
          <input
            type="text"
            className="mlt-input"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>

        {/* Extra Actions */}
        <div style={{ marginTop: "8px", borderTop: "1px solid var(--mlt-border)", paddingTop: "12px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mlt-text-muted)", marginBottom: "8px" }}>
            Quick Actions:
          </div>
          <ExtraActionButtons
            actions={mergedActions}
            context={{
              tool: "capture",
              properties: { dataUrl: capturedImage },
              map,
              closeModal: () => setModalOpen(false),
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default CaptureAreaControl;
