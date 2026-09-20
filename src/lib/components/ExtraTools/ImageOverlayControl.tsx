import { useState, type FC } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";
import { useLayerVisibility } from "../../context/LayerVisibilityContext";
import { Modal } from "../ui/Modal";
import { Popover } from "../ui/Popover";
import { ImageIcon, TuneIcon, TrashIcon } from "../ui/Icons";
import type { ExtraActionItem, ToolConfig } from "../../types/tools";
import { toast } from "sonner";

export interface OverlayImageItem {
  id: string;
  name: string;
  src: string;
  lng: number;
  lat: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface ImageOverlayControlProps {
  config?: ToolConfig;
  extraActions?: ExtraActionItem[];
}

export const ImageOverlayControl: FC<ImageOverlayControlProps> = () => {
  const { current: currentMap } = useMap();
  const map = currentMap?.getMap();
  const { isToolVisible } = useLayerVisibility();

  const [images, setImages] = useState<OverlayImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Form states for new image
  const [imgUrl, setImgUrl] = useState("");
  const [imgName, setImgName] = useState("");

  const activeImage = images.find((img) => img.id === activeImageId);

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgUrl.trim()) {
      toast.error("Please provide an image URL");
      return;
    }

    const center = map ? map.getCenter() : { lng: 51.389, lat: 35.6892 };

    const newOverlay: OverlayImageItem = {
      id: `img-${Date.now()}`,
      name: imgName.trim() || `Overlay ${images.length + 1}`,
      src: imgUrl.trim(),
      lng: center.lng,
      lat: center.lat,
      scale: 1,
      rotation: 0,
      opacity: 0.8,
    };

    setImages((prev) => [...prev, newOverlay]);
    setActiveImageId(newOverlay.id);
    setModalOpen(false);
    setImgUrl("");
    setImgName("");
    toast.success("Image overlay placed on map center");
  };

  const updateActiveImage = (key: keyof OverlayImageItem, value: any) => {
    if (!activeImageId) return;
    setImages((prev) =>
      prev.map((img) => (img.id === activeImageId ? { ...img, [key]: value } : img))
    );
  };

  const removeActiveImage = () => {
    if (!activeImageId) return;
    setImages((prev) => prev.filter((img) => img.id !== activeImageId));
    setActiveImageId(null);
    toast.info("Image overlay removed");
  };

  return (
    <>
      <button
        type="button"
        className={`mlt-icon-btn ${menuAnchor ? "mlt-icon-btn-active" : ""}`}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        title="Image Overlay Manager"
      >
        <ImageIcon size={18} />
      </button>

      {/* Quick Menu Popover */}
      <Popover
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        width={260}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Image Overlays</span>
            <button
              type="button"
              className="mlt-btn mlt-btn-primary"
              onClick={() => {
                setModalOpen(true);
                setMenuAnchor(null);
              }}
              style={{ fontSize: "0.75rem", padding: "3px 8px" }}
            >
              + Add
            </button>
          </div>

          {images.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--mlt-text-muted)" }}>
              No overlay images placed yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImageId(img.id)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor:
                      activeImageId === img.id
                        ? "rgba(0, 122, 255, 0.12)"
                        : "transparent",
                    border:
                      activeImageId === img.id
                        ? "1px solid #007aff"
                        : "1px solid transparent",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    {img.name}
                  </span>
                  <TuneIcon size={14} style={{ color: "var(--mlt-text-muted)" }} />
                </div>
              ))}
            </div>
          )}

          {activeImage && (
            <div style={{ marginTop: "6px", paddingTop: "8px", borderTop: "1px solid var(--mlt-border)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px" }}>
                Adjust: {activeImage.name}
              </div>
              <div className="mlt-form-group">
                <label className="mlt-label">
                  Scale ({activeImage.scale.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  className="mlt-slider"
                  min={0.2}
                  max={4}
                  step={0.1}
                  value={activeImage.scale}
                  onChange={(e) => updateActiveImage("scale", Number(e.target.value))}
                />
              </div>

              <div className="mlt-form-group">
                <label className="mlt-label">
                  Rotation ({activeImage.rotation}°)
                </label>
                <input
                  type="range"
                  className="mlt-slider"
                  min={-180}
                  max={180}
                  value={activeImage.rotation}
                  onChange={(e) => updateActiveImage("rotation", Number(e.target.value))}
                />
              </div>

              <div className="mlt-form-group">
                <label className="mlt-label">
                  Opacity ({(activeImage.opacity * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  className="mlt-slider"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={activeImage.opacity}
                  onChange={(e) => updateActiveImage("opacity", Number(e.target.value))}
                />
              </div>

              <button
                type="button"
                className="mlt-btn mlt-btn-danger"
                onClick={removeActiveImage}
                style={{ width: "100%", marginTop: "8px", justifyContent: "center", fontSize: "0.75rem" }}
              >
                <TrashIcon size={13} /> Delete Overlay
              </button>
            </div>
          )}
        </div>
      </Popover>

      {/* Render Markers for placed overlays on the map */}
      {isToolVisible("overlay") &&
        images.map((image) => (
          <Marker
            key={image.id}
            longitude={image.lng}
            latitude={image.lat}
            anchor="center"
            draggable
            onDragEnd={(e) => {
              setImages((prev) =>
                prev.map((img) =>
                  img.id === image.id
                    ? { ...img, lng: e.lngLat.lng, lat: e.lngLat.lat }
                    : img
                )
              );
            }}
          >
            <div
              onClick={() => setActiveImageId(image.id)}
              style={{
                cursor: "grab",
                outline:
                  activeImageId === image.id
                    ? "2px solid #007aff"
                    : "1px dashed rgba(255,255,255,0.6)",
                borderRadius: "4px",
                display: "inline-block",
              }}
            >
              <img
                src={image.src}
                alt={image.name}
                draggable="false"
                style={{
                  width: "240px",
                  display: "block",
                  transform: `scale(${image.scale}) rotate(${image.rotation}deg)`,
                  opacity: image.opacity,
                  pointerEvents: "auto",
                  transformOrigin: "center center",
                  transition: "transform 0.1s ease, opacity 0.1s ease",
                }}
              />
            </div>
          </Marker>
        ))}

      {/* Modal Dialog for Uploading / Adding Image URL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Image Overlay"
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
              onClick={handleAddImage}
            >
              Place on Map
            </button>
          </div>
        }
      >
        <div className="mlt-form-group">
          <label className="mlt-label">Overlay Name</label>
          <input
            type="text"
            className="mlt-input"
            placeholder="e.g. Master Plan Blueprint"
            value={imgName}
            onChange={(e) => setImgName(e.target.value)}
          />
        </div>

        <div className="mlt-form-group">
          <label className="mlt-label">Image URL</label>
          <input
            type="text"
            className="mlt-input"
            placeholder="https://example.com/map-overlay.png"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--mlt-text-muted)", marginTop: "4px" }}>
            Paste direct URL to a PNG or JPG map overlay
          </span>
        </div>
      </Modal>
    </>
  );
};

export default ImageOverlayControl;
