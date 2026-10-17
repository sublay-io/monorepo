import { useEffect, useRef, useState } from "react";
import { type CommentsSortByOptions, useCommentSection } from "@sublay/react-js";
import useUIState from "../hooks/use-ui-state";
import strings from "../utils/strings";

// The sorts the dropdown offers, each with the direction it sorts in. New and
// Old share createdAt and differ only in direction. Remove an entry to drop
// that option; the first entry is shown when the section's sort isn't listed.
const SORT_OPTIONS: {
  sortBy: CommentsSortByOptions;
  sortDir: "asc" | "desc";
  label: string;
}[] = [
  { sortBy: "top", sortDir: "desc", label: strings.sortTop },
  { sortBy: "createdAt", sortDir: "desc", label: strings.sortNew },
  { sortBy: "createdAt", sortDir: "asc", label: strings.sortOld },
  { sortBy: "controversial", sortDir: "desc", label: strings.sortControversial },
];

function SortByDropdown() {
  const { sortBy, setSortBy, sortDir, setSortDir } = useCommentSection();
  const { theme } = useUIState();
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎨 CUSTOMIZATION: Sort dropdown colors
  const colors = {
    label: isDark ? "#A3A3A3" : "#6B7280",
    text: isDark ? "#FAFAFA" : "#111827",
    button: isDark ? "#404040" : "#F3F4F6",
    buttonHover: isDark ? "#525252" : "#E5E7EB",
    menu: isDark ? "#262626" : "#FFFFFF",
    menuBorder: isDark ? "#525252" : "#E5E7EB",
    itemActive: isDark ? "#404040" : "#F3F4F6",
    itemHover: isDark ? "#404040" : "#F9FAFB",
  };

  // controversial ranks one way only, so its direction doesn't pick an option
  const current =
    SORT_OPTIONS.find(
      (option) =>
        option.sortBy === sortBy &&
        (option.sortBy === "controversial" || option.sortDir === sortDir)
    ) ?? SORT_OPTIONS[0];

  // Clicking outside the dropdown, or Escape, closes it
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
      <span style={{ color: colors.label }}>{strings.sortBy}</span>
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          style={{
            // 🎨 CUSTOMIZATION: Sort button styling
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            height: "32px",
            padding: "0 12px",
            borderRadius: "9999px",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            color: colors.text,
            backgroundColor: colors.button,
            cursor: "pointer",
            transition: "background-color 150ms ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.button;
          }}
        >
          {current.label}
          <svg
            style={{
              height: "16px",
              width: "16px",
              transition: "transform 150ms ease-in-out",
              transform: isOpen ? "rotate(180deg)" : "none",
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div
            role="menu"
            style={{
              // 🎨 CUSTOMIZATION: Sort menu styling
              position: "absolute",
              top: "100%",
              insetInlineStart: 0,
              marginTop: "4px",
              zIndex: 50,
              minWidth: "10rem",
              padding: "4px 0",
              borderRadius: "12px",
              border: `1px solid ${colors.menuBorder}`,
              backgroundColor: colors.menu,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {SORT_OPTIONS.map((option) => {
              const isActive = option === current;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setSortBy?.(option.sortBy);
                    setSortDir?.(option.sortDir);
                    setIsOpen(false);
                  }}
                  style={{
                    // 🎨 CUSTOMIZATION: Sort menu item styling
                    display: "block",
                    width: "100%",
                    padding: "8px 16px",
                    textAlign: "start",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                    color: colors.text,
                    backgroundColor: isActive ? colors.itemActive : "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = colors.itemHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SortByDropdown;
