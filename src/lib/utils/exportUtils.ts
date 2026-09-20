/**
 * Trigger browser download of a GeoJSON object as a .geojson or .json file
 */
export function downloadGeoJSON(data: any, filename = "map-features.geojson") {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy string / JSON representation to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Export canvas portion as a downloadable PNG image
 */
export function downloadCanvasArea(
  canvas: HTMLCanvasElement,
  rect: { x: number; y: number; width: number; height: number },
  filename = "map-capture.png"
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = rect.width;
      outputCanvas.height = rect.height;
      const ctx = outputCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not acquire 2D context");

      ctx.drawImage(
        canvas,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      const dataUrl = outputCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}
