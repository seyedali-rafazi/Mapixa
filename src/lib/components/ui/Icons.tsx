import {
  MapPin,
  Route,
  Hexagon,
  Circle,
  Square,
  Pencil,
  GitFork,
  Ruler,
  Crop,
  Locate,
  Image as LucideImage,
  Home,
  Plus,
  Minus,
  Compass,
  ZoomIn,
  Maximize,
  Minimize,
  X,
  Trash2,
  Copy,
  Check,
  Sliders,
  ChevronUp,
  PenTool,
  Wrench,
  Download,
  Plane,
  Eye,
  EyeOff,
  Crosshair,
  Layers,
  type LucideProps,
} from "lucide-react";

export type IconProps = LucideProps;

// Semantic tool icon aliases powered by lucide-react
export const PinIcon = MapPin;
export const LineIcon = Route;
export const PolygonIcon = Hexagon;
export const CircleIcon = Circle;
export const RectangleIcon = Square;
export const FreehandIcon = Pencil;
export const IntersectionIcon = GitFork;
export const RulerIcon = Ruler;
export const CropIcon = Crop;
export const GpsIcon = Locate;
export const ImageIcon = LucideImage;
export const HomeIcon = Home;
export const PlusIcon = Plus;
export const MinusIcon = Minus;
export const CompassIcon = Compass;
export const BoxZoomIcon = ZoomIn;
export const FullscreenIcon = Maximize;
export const FullscreenExitIcon = Minimize;
export const CloseIcon = X;
export const TrashIcon = Trash2;
export const CopyIcon = Copy;
export const CheckIcon = Check;
export const TuneIcon = Sliders;
export const ArrowUpIcon = ChevronUp;
export const DrawIcon = PenTool;
export const ToolsIcon = Wrench;
export const DownloadIcon = Download;
export const FlightIcon = Plane;
export const EyeIcon = Eye;
export const EyeOffIcon = EyeOff;
export const SplitIcon = GitFork;
export const CrosshairIcon = Crosshair;
export const LayersIcon = Layers;

// Re-export all lucide-react components for flexible usage
export * from "lucide-react";
