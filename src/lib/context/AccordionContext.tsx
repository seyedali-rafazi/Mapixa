import { createContext, useContext, type ReactNode } from "react";

export interface AccordionContextValue {
  isInAccordion: boolean;
  accordionId?: string;
  backgroundColor?: string;
  isDark?: boolean;
}

export const AccordionContext = createContext<AccordionContextValue>({
  isInAccordion: false,
});

export function AccordionContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AccordionContextValue;
}) {
  return (
    <AccordionContext.Provider value={value}>
      {children}
    </AccordionContext.Provider>
  );
}

export function useAccordionContext(): AccordionContextValue {
  return useContext(AccordionContext);
}

export default AccordionContext;
