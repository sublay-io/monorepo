import { useState, type ComponentType } from "react";
import { ControlGroup, Field, Segmented } from "./Controls";
import { HighlightControl, useHighlightedCommentId } from "./HighlightControl";
import {
  EntitySource,
  useEntitySourceMode,
  type EntitySourceProps,
} from "./EntitySourceControl";

type StyleVariant = "styled" | "tailwind";
type Theme = "light" | "dark";
type Direction = "ltr" | "rtl";
type Language = "en" | "he";

// A fixed height, as in a real embed: the section fills it and the comment
// list scrolls inside.
const SECTION_HEIGHT = 640;

type SectionProps = EntitySourceProps & {
  isVisible: boolean;
  highlightedCommentId?: string;
  gifPickerFullScreen: boolean;
};

function currentLanguage(): Language {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem("playground-lang");
  } catch {
    // Storage is unavailable: fall back to the URL or English
  }
  const lang =
    new URLSearchParams(window.location.search).get("lang") ?? stored;
  return lang === "he" ? "he" : "en";
}

// The language is chosen when a component's strings module loads (see
// sublayLanguageSwitch in vite.config.ts), so changing it reloads the page.
function setLanguage(language: Language) {
  try {
    window.localStorage.setItem("playground-lang", language);
  } catch {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete("lang");
  url.searchParams.delete("dir");
  window.location.replace(url);
}

/**
 * A comment section next to the settings that drive it. Shared by the social
 * and threaded pages, which differ only in the components they show.
 */
export default function CommentsPlayground({
  name,
  foreignId,
  maxWidth,
  Styled,
  Tailwind,
}: {
  name: string;
  foreignId: string;
  maxWidth: number;
  Styled: ComponentType<SectionProps & { theme: Theme }>;
  Tailwind: ComponentType<SectionProps>;
}) {
  const language = currentLanguage();
  const [variant, setVariant] = useState<StyleVariant>("styled");
  const [theme, setTheme] = useState<Theme>("light");
  const [dir, setDir] = useState<Direction>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("dir");
    if (fromUrl === "rtl" || fromUrl === "ltr") return fromUrl;
    return language === "he" ? "rtl" : "ltr";
  });
  const [gifPickerFullScreen, setGifPickerFullScreen] = useState(false);
  const { highlightedCommentId, applied, apply } = useHighlightedCommentId();
  const { mode: entitySource, setMode: setEntitySource } =
    useEntitySourceMode();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: 24,
      }}
    >
      <div style={{ flex: "1 1 420px", minWidth: 0, maxWidth }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>
          {name}
        </h2>
        <div
          style={{
            height: SECTION_HEIGHT,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
          }}
          className={theme === "dark" ? "dark" : ""}
          dir={dir}
        >
          <EntitySource mode={entitySource} foreignId={foreignId}>
            {(entityProps) =>
              variant === "styled" ? (
                <Styled
                  {...entityProps}
                  isVisible={true}
                  highlightedCommentId={highlightedCommentId}
                  gifPickerFullScreen={gifPickerFullScreen}
                  theme={theme}
                />
              ) : (
                <Tailwind
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

      <aside
        style={{
          flex: "0 0 300px",
          display: "grid",
          gap: 20,
          padding: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <ControlGroup title="Component">
          <Field label="Style">
            <Segmented
              value={variant}
              onChange={setVariant}
              options={[
                { value: "styled", label: "Styled" },
                { value: "tailwind", label: "Tailwind" },
              ]}
            />
          </Field>
        </ControlGroup>

        <ControlGroup title="Appearance">
          <Field label="Theme">
            <Segmented
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Field>
          <Field label="Language" hint="Reloads the page.">
            <Segmented
              value={language}
              onChange={setLanguage}
              options={[
                { value: "en", label: "English" },
                { value: "he", label: "עברית" },
              ]}
            />
          </Field>
          <Field label="Direction">
            <Segmented
              value={dir}
              onChange={setDir}
              options={[
                { value: "ltr", label: "LTR" },
                { value: "rtl", label: "RTL" },
              ]}
            />
          </Field>
        </ControlGroup>

        <ControlGroup title="Props">
          <Field label="Entity">
            <Segmented
              value={entitySource}
              onChange={setEntitySource}
              options={[
                { value: "foreignId", label: "foreignId" },
                { value: "entity", label: "Object" },
              ]}
            />
          </Field>
          <Field label="GIF picker">
            <Segmented
              value={gifPickerFullScreen ? "full" : "section"}
              onChange={(v) => setGifPickerFullScreen(v === "full")}
              options={[
                { value: "section", label: "Section" },
                { value: "full", label: "Full screen" },
              ]}
            />
          </Field>
        </ControlGroup>

        <ControlGroup title="Highlighted comment">
          <HighlightControl applied={applied} onApply={apply} />
        </ControlGroup>
      </aside>
    </div>
  );
}
