import type { CSSProperties, ReactNode } from "react";

/** A titled group of settings in the side panel. */
export function ControlGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <h3
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#9ca3af",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/** One setting: its name on the left, its control on the right. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
        {children}
      </div>
      {hint && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#9ca3af" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

/** A choice between a few options, shown side by side. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "#f3f4f6",
        borderRadius: 6,
        padding: 2,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              padding: "3px 10px",
              borderRadius: 5,
              border: "none",
              background: active ? "#fff" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,.1)" : "none",
              color: active ? "#111" : "#6b7280",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const buttonStyle: CSSProperties = {
  padding: "4px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 13,
};
