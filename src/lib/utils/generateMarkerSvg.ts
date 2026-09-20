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
    <filter id="marker-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.35"/>
    </filter>
    <path d="M50 5 C27.9 5 10 22.9 10 45 C10 75 50 95 50 95 C50 95 90 75 90 45 C90 22.9 72.1 5 50 5 Z" 
          fill="${m.markerColor || "#ff3b30"}" opacity="${opacity}" stroke="#ffffff" stroke-width="4" filter="url(#marker-shadow)"/>
    ${iconSvg}
  </svg>`;
}

export default generateMarkerSvg;
