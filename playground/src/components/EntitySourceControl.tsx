import { useState, type ReactNode } from "react";
import { EntityProvider, useEntity, type Entity } from "@sublay/react-js";

export type EntitySourceMode = "foreignId" | "entity";

const PARAM = "entity";

function readParam(): EntitySourceMode {
  return new URLSearchParams(window.location.search).get(PARAM) === "object"
    ? "entity"
    : "foreignId";
}

function writeParam(mode: EntitySourceMode) {
  const url = new URL(window.location.href);
  if (mode === "entity") url.searchParams.set(PARAM, "object");
  else url.searchParams.delete(PARAM);
  window.history.replaceState(null, "", url);
}

/**
 * How the comment section is told which entity it's for. Kept in the URL as
 * `?entity=object`, so a reload keeps the choice.
 */
export function useEntitySourceMode() {
  const [mode, setModeState] = useState<EntitySourceMode>(readParam);
  const setMode = (next: EntitySourceMode) => {
    setModeState(next);
    writeParam(next);
  };
  return { mode, setMode };
}

const LABELS: Record<EntitySourceMode, string> = {
  foreignId: "Pass foreignId",
  entity: "Pass entity object",
};

export function EntitySourceToggle({
  value,
  onChange,
}: {
  value: EntitySourceMode;
  onChange: (mode: EntitySourceMode) => void;
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
      {(["foreignId", "entity"] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          style={{
            padding: "3px 10px",
            borderRadius: 5,
            border: "none",
            background: value === mode ? "#fff" : "transparent",
            boxShadow: value === mode ? "0 1px 2px rgba(0,0,0,.1)" : "none",
            color: value === mode ? "#111" : "#6b7280",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: value === mode ? 600 : 400,
          }}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  );
}

export type EntitySourceProps =
  | { foreignId: string; createIfNotFound: true }
  | { entity: Entity | null | undefined };

/**
 * Wraps the section in `EntityProvider` and hands it the props for the chosen
 * mode: the `foreignId` (with `createIfNotFound`, so the section creates the
 * test entity itself when it's the first to ask for it), or the entity object
 * from `useEntity()`. That object
 * is replaced whenever the entity changes (posting a comment updates its
 * `commentsCount`), which is what the "entity" mode is here to exercise.
 */
export function EntitySource({
  mode,
  foreignId,
  children,
}: {
  mode: EntitySourceMode;
  foreignId: string;
  children: (props: EntitySourceProps) => ReactNode;
}) {
  return (
    <EntityProvider foreignId={foreignId} createIfNotFound>
      <EntitySourceInner mode={mode} foreignId={foreignId}>
        {children}
      </EntitySourceInner>
    </EntityProvider>
  );
}

function EntitySourceInner({
  mode,
  foreignId,
  children,
}: {
  mode: EntitySourceMode;
  foreignId: string;
  children: (props: EntitySourceProps) => ReactNode;
}) {
  const { entity } = useEntity();
  return (
    <>
      {children(
        mode === "entity" ? { entity } : { foreignId, createIfNotFound: true },
      )}
    </>
  );
}
