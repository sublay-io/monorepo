import { useEffect, useRef, useState } from "react";
import { type CommentsSortByOptions, useCommentSection } from "@sublay/react-js";
import { cn } from "~shared/react/cn";
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="flex items-center gap-2 text-[13px]">
      <span className="text-gray-500 dark:text-neutral-400">{strings.sortBy}</span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            // 🎨 CUSTOMIZATION: Sort button styling
            "inline-flex items-center gap-1 h-8 px-3 rounded-full",
            "font-semibold text-gray-900 dark:text-neutral-50",
            "bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600",
            "transition-colors duration-150"
          )}
        >
          {current.label}
          <svg
            className={cn("h-4 w-4 transition-transform duration-150", isOpen && "rotate-180")}
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
            className={cn(
              // 🎨 CUSTOMIZATION: Sort menu styling
              "absolute top-full start-0 mt-1 z-50 min-w-[10rem] py-1",
              "rounded-xl border border-gray-200 dark:border-neutral-600",
              "bg-white dark:bg-neutral-800 shadow-lg"
            )}
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
                  className={cn(
                    // 🎨 CUSTOMIZATION: Sort menu item styling
                    "block w-full px-4 py-2 text-start text-sm",
                    "text-gray-900 dark:text-neutral-50",
                    isActive
                      ? "font-semibold bg-gray-100 dark:bg-neutral-700"
                      : "hover:bg-gray-50 dark:hover:bg-neutral-700"
                  )}
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
