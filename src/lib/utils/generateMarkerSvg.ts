export interface MarkerSvgConfig {
  size: number;
  opacity: number;
  markerColor: string;
  iconType: "star" | "circle" | "square" | "pin";
  iconColor: string;
}

/**
 * Generate valid SVG string for a modern map pin marker
 */
export function generateMarkerSvg(m: MarkerSvgConfig): string {
  const size = m.size || 40;
  const opacity = (m.opacity ?? 100) / 100;
  let iconSvg = "";

  if (m.iconType === "star") {
    iconSvg = `<polygon points="50,15 61,35 82,35 65,48 72,68 50,55 28,68 35,48 18,35 39,35" fill="${m.iconColor || "#ffffff"}" />`;
  } else if (m.iconType === "circle") {
    iconSvg = `<circle cx="50" cy="40" r="16" fill="${m.iconColor || "#ffffff"}" />`;
  } else if (m.iconType === "square") {
    iconSvg = `<rect x="34" y="24" width="32" height="32" rx="4" fill="${m.iconColor || "#ffffff"}" />`;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Vector Drop Shadow -->
    <ellipse cx="50" cy="94" rx="20" ry="5" fill="rgba(0,0,0,0.28)" />
    <!-- Pin Body -->
    <path d="M50 6 C28 6 11 23 11 45 C11 74 50 93 50 93 C50 93 89 74 89 45 C89 23 72 6 50 6 Z" 
          fill="${m.markerColor || "#ff3b30"}" opacity="${opacity}" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
    <!-- Inner Icon -->
    ${iconSvg}
  </svg>`;
}

export default generateMarkerSvg;
