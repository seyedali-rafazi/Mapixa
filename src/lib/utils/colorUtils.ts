/**
 * Checks whether a CSS color string represents a dark color.
 * Supports hex (#000, #000000), rgb/rgba, hsl/hsla, and named dark colors.
 */
export function isDarkColor(colorStr?: string): boolean {
  if (!colorStr) return false;
  const str = colorStr.trim().toLowerCase();

  const darkNames = [
    "black",
    "navy",
    "darkblue",
    "midnightblue",
    "darkslategray",
    "darkslategrey",
    "indigo",
    "maroon",
  ];
  if (darkNames.includes(str)) return true;
  if (["white", "transparent", "initial", "inherit"].includes(str)) return false;

  // Hex (#rgb, #rgba, #rrggbb, #rrggbbaa)
  if (str.startsWith("#")) {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.55;
    }
  }

  // rgb(...) or rgba(...)
  const rgbMatch = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.55;
  }

  // hsl(...) or hsla(...)
  const hslMatch = str.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    const lightness = parseInt(hslMatch[3], 10);
    return lightness < 50;
  }

  return false;
}
