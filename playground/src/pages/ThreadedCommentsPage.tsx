import React, { useState } from "react";
import ThreadedCommentSectionStyled from "../../../registry/react/comments-threaded/styled/files/threaded-comment-section";
import ThreadedCommentSectionTailwind from "../../../registry/react/comments-threaded/tailwind/files/threaded-comment-section";
import {
  HighlightControl,
  useHighlightedCommentId,
} from "../components/HighlightControl";
import {
  EntitySource,
  EntitySourceToggle,
  useEntitySourceMode,
} from "../components/EntitySourceControl";

type StyleVariant = "styled" | "tailwind";

const SECTION_HEIGHT = 640;

const FOREIGN_ID = "playground-threaded-comments";

export default function ThreadedCommentsPage() {
  const [variant, setVariant] = useState<StyleVariant>("styled");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [gifPickerFullScreen, setGifPickerFullScreen] = useState(false);
  const [dir, setDir] = useState<"ltr" | "rtl">(() =>
    new URLSearchParams(window.location.search).get("dir") === "rtl"
      ? "rtl"
      : "ltr"
  );
  const { highlightedCommentId, applied, apply } = useHighlightedCommentId();
  const { mode: entitySource, setMode: setEntitySource } =
    useEntitySourceMode();

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          comments-threaded
        </h2>
        <VariantToggle value={variant} onChange={setVariant} />
        <EntitySourceToggle value={entitySource} onChange={setEntitySource} />
        <GifPickerToggle
          value={gifPickerFullScreen}
          onChange={setGifPickerFullScreen}
        />
        <DirectionToggle value={dir} onChange={setDir} />
        <ThemeToggle value={theme} onChange={setTheme} />
      </div>

      <HighlightControl applied={applied} onApply={apply} />

      {/* A fixed height, as in a real embed: the section fills it and the
          comment list scrolls inside. */}
      <div
        style={{
          height: SECTION_HEIGHT,
          maxWidth: 700,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}
        className={theme === "dark" ? "dark" : ""}
        dir={dir}
      >
        <EntitySource mode={entitySource} foreignId={FOREIGN_ID}>
          {(entityProps) =>
            variant === "styled" ? (
              <ThreadedCommentSectionStyled
                {...entityProps}
                isVisible={true}
                highlightedCommentId={highlightedCommentId}
                gifPickerFullScreen={gifPickerFullScreen}
                theme={theme}
              />
            ) : (
              <ThreadedCommentSectionTailwind
                {...entityProps}
                isVisible={true}
                highlightedCommentId={highlightedCommentId}
                gifPickerFullScreen={gifPickerFullScreen}
              />
            )
          }
        </EntitySource>
      </div>
    </div>
  );
}

function VariantToggle({
  value,
  onChange,
}: {
  value: StyleVariant;
  onChange: (v: StyleVariant) => void;
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
      {(["styled", "tailwind"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding: "3px 10px",
            borderRadius: 5,
            border: "none",
            background: value === v ? "#fff" : "transparent",
            boxShadow: value === v ? "0 1px 2px rgba(0,0,0,.1)" : "none",
            color: value === v ? "#111" : "#6b7280",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: value === v ? 600 : 400,
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function GifPickerToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (fullScreen: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "#f3f4f6",
        borderRadius: 6,
        padding: 2,
      }}
    >
      <span style={{ padding: "0 6px", fontSize: 13, color: "#6b7280" }}>
        GIF picker:
      </span>
      {([false, true] as const).map((fullScreen) => (
        <button
          key={String(fullScreen)}
          onClick={() => onChange(fullScreen)}
          style={{
            padding: "3px 10px",
            borderRadius: 5,
            border: "none",
            background: value === fullScreen ? "#fff" : "transparent",
            boxShadow:
              value === fullScreen ? "0 1px 2px rgba(0,0,0,.1)" : "none",
            color: value === fullScreen ? "#111" : "#6b7280",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: value === fullScreen ? 600 : 400,
          }}
        >
          {fullScreen ? "full screen" : "section"}
        </button>
      ))}
    </div>
  );
}

function DirectionToggle({
  value,
  onChange,
}: {
  value: "ltr" | "rtl";
  onChange: (v: "ltr" | "rtl") => void;
}) {
  return (
    <button
      onClick={() => onChange(value === "ltr" ? "rtl" : "ltr")}
      style={{
        padding: "4px 12px",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {value === "ltr" ? "LTR" : "RTL"}
    </button>
  );
}

function ThemeToggle({
  value,
  onChange,
}: {
  value: "light" | "dark";
  onChange: (v: "light" | "dark") => void;
}) {
  return (
    <button
      onClick={() => onChange(value === "light" ? "dark" : "light")}
      style={{
        marginLeft: "auto",
        padding: "4px 12px",
        borderRadius: 6,
        border: "1px solid #d1d5db",
        background: value === "dark" ? "#1f2937" : "#fff",
        color: value === "dark" ? "#f9fafb" : "#374151",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {value === "light" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
