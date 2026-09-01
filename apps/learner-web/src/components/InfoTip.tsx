import { useId, useState, type ReactNode } from "react";

/**
 * "?" affordance for longer explanations: hover or keyboard focus reveals the
 * bubble, tap toggles it (touch), Escape dismisses. The bubble stays in the
 * accessibility tree as the trigger's description.
 */
export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  return (
    <span
      className={`info-tip${open ? " is-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="info-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={tipId}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span role="tooltip" id={tipId} className="info-bubble">
        {children}
      </span>
    </span>
  );
}
