import { useState } from "react";
import { buttonStyle } from "./Controls";

const PARAM = "highlight";

function readParam(): string {
  return new URLSearchParams(window.location.search).get(PARAM)?.trim() ?? "";
}

function writeParam(id: string) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(PARAM, id);
  else url.searchParams.delete(PARAM);
  window.history.replaceState(null, "", url);
}

/**
 * Holds the comment id passed as `highlightedCommentId`. Starts from the
 * `?highlight=<id>` query param and keeps it in sync on Apply / Clear.
 */
export function useHighlightedCommentId() {
  const [applied, setApplied] = useState<string>(readParam);
  const apply = (id: string) => {
    const next = id.trim();
    setApplied(next);
    writeParam(next);
  };
  return { highlightedCommentId: applied || undefined, applied, apply };
}

export function HighlightControl({
  applied,
  onApply,
}: {
  applied: string;
  onApply: (id: string) => void;
}) {
  const [draft, setDraft] = useState(applied);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      style={{ display: "grid", gap: 8 }}
    >
      <input
        aria-label="Comment id to highlight"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="comment id"
        spellCheck={false}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          fontSize: 13,
          fontFamily: "monospace",
          minWidth: 0,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="submit" style={buttonStyle}>
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onApply("");
          }}
          style={buttonStyle}
        >
          Clear
        </button>
        {applied && (
          <span style={{ fontSize: 12, color: "#15803d" }}>active</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>
        Copy an id from the Network tab (GET /comments response).
      </div>
    </form>
  );
}
