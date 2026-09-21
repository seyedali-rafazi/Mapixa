import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type {
  ToolType,
  ToolsConfiguration,
  AfterDrawMode,
  ExtraActionItem,
} from "../types/tools";
import type { DrawEndEvent, DrawChangeEvent, DrawDeleteEvent } from "../types/events";

export type ActiveTool = ToolType | string | null;

export interface MapToolContextValue {
  activeTool: ActiveTool;
  setActiveTool: Dispatch<SetStateAction<ActiveTool>>;
  toolsConfig?: ToolsConfiguration;
  afterDrawMode?: AfterDrawMode;
  extraActions?: ExtraActionItem[];
  onDrawEnd?: (event: DrawEndEvent) => void;
  onDrawStart?: (tool: ToolType) => void;
  onDrawChange?: (event: DrawChangeEvent) => void;
  onDrawDelete?: (event: DrawDeleteEvent) => void;
  themeColor?: string;
  modalBackground?: string;
  modalStyle?: React.CSSProperties;
  popoverBackground?: string;
  popoverStyle?: React.CSSProperties;
}

const MapToolContext = createContext<MapToolContextValue>({
  activeTool: null,
  setActiveTool: () => {},
});

export interface MapToolProviderProps {
  children: ReactNode;
  toolsConfig?: ToolsConfiguration;
  afterDrawMode?: AfterDrawMode;
  extraActions?: ExtraActionItem[];
  onDrawEnd?: (event: DrawEndEvent) => void;
  onDrawStart?: (tool: ToolType) => void;
  onDrawChange?: (event: DrawChangeEvent) => void;
  onDrawDelete?: (event: DrawDeleteEvent) => void;
  themeColor?: string;
  modalBackground?: string;
  modalStyle?: React.CSSProperties;
  popoverBackground?: string;
  popoverStyle?: React.CSSProperties;
}

export function MapToolProvider({
  children,
  toolsConfig,
  afterDrawMode = "modal",
  extraActions,
  onDrawEnd,
  onDrawStart,
  onDrawChange,
  onDrawDelete,
  themeColor,
  modalBackground,
  modalStyle,
  popoverBackground,
  popoverStyle,
}: MapToolProviderProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const handleSetActiveTool: Dispatch<SetStateAction<ActiveTool>> = useCallback(
    (action) => {
      setActiveTool((prev) => {
        const next = typeof action === "function" ? (action as any)(prev) : action;
        if (next && next !== prev && onDrawStart) {
          onDrawStart(next as ToolType);
        }
        return next;
      });
    },
    [onDrawStart]
  );

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool: handleSetActiveTool,
      toolsConfig,
      afterDrawMode,
      extraActions,
      onDrawEnd,
      onDrawStart,
      onDrawChange,
      onDrawDelete,
      themeColor,
      modalBackground,
      modalStyle,
      popoverBackground,
      popoverStyle,
    }),
    [
      activeTool,
      handleSetActiveTool,
      toolsConfig,
      afterDrawMode,
      extraActions,
      onDrawEnd,
      onDrawStart,
      onDrawChange,
      onDrawDelete,
      themeColor,
      modalBackground,
      modalStyle,
      popoverBackground,
      popoverStyle,
    ]
  );

  return (
    <MapToolContext.Provider value={value}>{children}</MapToolContext.Provider>
  );
}

export function useMapTool() {
  return useContext(MapToolContext);
}

/**
 * Hook to manage exclusive tool activation.
 * When this tool activates, any other active tool automatically deactivates.
 */
export function useExclusiveTool(
  id: ToolType | string
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const { activeTool, setActiveTool } = useContext(MapToolContext);
  const isActive = activeTool === id;

  const setIsActive = useCallback<Dispatch<SetStateAction<boolean>>>(
    (action) => {
      setActiveTool((prev) => {
        const currentlyActive = prev === id;
        const next =
          typeof action === "function"
            ? (action as (p: boolean) => boolean)(currentlyActive)
            : action;
        if (next) return id;
        return currentlyActive ? null : prev;
      });
    },
    [id, setActiveTool]
  );

  return [isActive, setIsActive];
}
