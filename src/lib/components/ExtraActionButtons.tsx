import type { ExtraActionItem, ActionContext } from "../types/tools";

export interface ExtraActionButtonsProps {
  actions?: ExtraActionItem[];
  context: ActionContext;
}

export function ExtraActionButtons({
  actions,
  context,
}: ExtraActionButtonsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
      {actions.map((action) => {
        const variantClass =
          action.variant === "contained"
            ? "mlt-btn-primary"
            : action.variant === "outlined"
            ? "mlt-btn-outlined"
            : "mlt-btn-outlined";

        return (
          <button
            key={action.id}
            type="button"
            className={`mlt-btn mlt-btn-sm ${variantClass}`}
            title={action.tooltip}
            onClick={() => action.onClick(context)}
          >
            {action.icon && <span style={{ display: "inline-flex" }}>{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ExtraActionButtons;
