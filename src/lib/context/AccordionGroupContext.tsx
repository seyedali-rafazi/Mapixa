import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AccordionGroupContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

const AccordionGroupContext = createContext<AccordionGroupContextValue | null>(
  null
);

export function AccordionGroupProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const value = useMemo(() => ({ openId, setOpenId }), [openId]);

  return (
    <AccordionGroupContext.Provider value={value}>
      {children}
    </AccordionGroupContext.Provider>
  );
}

export function useAccordionGroupItem(id: string): {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
} {
  const group = useContext(AccordionGroupContext);
  const [localExpanded, setLocalExpanded] = useState(false);

  if (!group) {
    return { expanded: localExpanded, setExpanded: setLocalExpanded };
  }

  return {
    expanded: group.openId === id,
    setExpanded: (expanded: boolean) =>
      group.setOpenId(expanded ? id : null),
  };
}
