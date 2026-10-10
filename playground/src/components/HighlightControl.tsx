import { useState, type CSSProperties } from "react";

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
    <div style={{ marginBottom: 16 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply(draft);
        }}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <label
          htmlFor="highlight-comment-id"
          style={{ fontSize: 13, color: "#374151" }}
        >
          Highlight comment id
        </label>
        <input
          id="highlight-comment-id"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="comment id"
          spellCheck={false}
          style={{
            width: 300,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 13,
            fontFamily: "monospace",
          }}
        />
        <button type="submit" style={btnStyle}>
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onApply("");
          }}
          style={btnStyle}
        >
          Clear
        </button>
        {applied && (
          <span style={{ fontSize: 12, color: "#15803d" }}>active</span>
        )}
      </form>
      <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
        Tip: copy a comment id from the Network tab (GET /comments response)
      </div>
    </div>
  );
}

const btnStyle: CSSProperties = {
  padding: "4px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 13,
};
