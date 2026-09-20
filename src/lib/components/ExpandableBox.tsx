import { type FC, type ReactNode } from "react";
import { ArrowUpIcon } from "./ui/Icons";
import { useAccordionGroupItem } from "../context/AccordionGroupContext";

export interface ExpandableBoxProps {
  children: ReactNode;
  accordionText: string;
  accordionIcon: ReactNode;
  id?: string;
  tooltip?: string;
  footer?: ReactNode;
}

export const ExpandableBox: FC<ExpandableBoxProps> = ({
  children,
  accordionText,
  accordionIcon,
  id,
  tooltip,
  footer,
}) => {
  const { expanded, setExpanded } = useAccordionGroupItem(id ?? accordionText);

  return (
    <div
      className={`mlt-expandable-box ${expanded ? "expanded" : ""}`}
      title={tooltip || `${accordionText} Tools`}
    >
      {/* Main Toggle Button */}
      <button
        type="button"
        className={`mlt-accordion-toggle ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {accordionIcon}
        <span className="mlt-accordion-title">{accordionText}</span>
      </button>

      {/* Smooth CSS Grid Expansion Body */}
      <div
        className={`mlt-accordion-body ${expanded ? "expanded" : ""}`}
        aria-hidden={!expanded}
      >
        <div className="mlt-accordion-inner">
          {children}

          <div className="mlt-divider" />

          {/* Close Arrow */}
          <button
            type="button"
            className="mlt-icon-btn mlt-accordion-collapse-btn"
            style={{ width: 28, height: 28 }}
            onClick={() => setExpanded(false)}
            title="Collapse"
            tabIndex={expanded ? 0 : -1}
          >
            <ArrowUpIcon size={14} />
          </button>
        </div>
      </div>

      {footer && (
        <div style={{ width: "100%", padding: "4px", display: "flex", justifyContent: "center" }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default ExpandableBox;
