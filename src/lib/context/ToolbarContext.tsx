import { createContext, useContext, useState, type ReactNode } from "react";

export interface ToolbarContextValue {
  toolbarElement: HTMLElement | null;
  setToolbarElement: (element: HTMLElement | null) => void;
}

export const ToolbarContext = createContext<ToolbarContextValue>({
  toolbarElement: null,
  setToolbarElement: () => {},
});

export function ToolbarProvider({ children }: { children: ReactNode }) {
  const [toolbarElement, setToolbarElement] = useState<HTMLElement | null>(null);

  return (
    <ToolbarContext.Provider value={{ toolbarElement, setToolbarElement }}>
      {children}
    </ToolbarContext.Provider>
  );
}

export function useToolbarContext(): ToolbarContextValue {
  return useContext(ToolbarContext);
}

export default ToolbarContext;
