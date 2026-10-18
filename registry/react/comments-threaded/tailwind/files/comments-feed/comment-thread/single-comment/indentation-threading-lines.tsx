import React, { createContext } from "react";
import { cn } from "@/lib/utils";
import strings from "../../../../utils/strings";
// 🎨 CUSTOMIZATION: Thread geometry. Every connector line is derived from
// these values, so changing one keeps the joins intact.

// 🎨 CUSTOMIZATION: Avatar size (Default: 28px)
export const AVATAR_SIZE = 28;
// 🎨 CUSTOMIZATION: Indentation per reply level (Default: 24px).
// Keep it larger than half the avatar, or the elbows have no room.
export const INDENT = 24;
// 🎨 CUSTOMIZATION: Levels that indent; deeper replies stay in one column (Default: 6)
export const MAX_INDENT_DEPTH = 6;
// 🎨 CUSTOMIZATION: Vertical padding of a comment row (Default: 8px)
export const ROW_PADDING_Y = 8;
// 🎨 CUSTOMIZATION: Space between the top of a row's content and its avatar (Default: 0px)
export const AVATAR_OFFSET_TOP = 0;
// 🎨 CUSTOMIZATION: Gap between the avatar and the comment content (Default: 12px)
export const AVATAR_GAP = 12;
// 🎨 CUSTOMIZATION: Space between the comments and the edges on both sides
// of the section (Default: 16px). The highlight of a comment reaches across it.
export const SECTION_PADDING_X = 16;
// 🎨 CUSTOMIZATION: Threading line thickness (Default: 1px)
export const LINE_WIDTH = 1;
// 🎨 CUSTOMIZATION: Roundness of the elbow into each reply (Default: 12px)
export const ELBOW_RADIUS = 12;

// Start edge of the vertical line, measured from the start edge of the comment
// it hangs from: centred under that comment's avatar.
export const RAIL_X = Math.floor((AVATAR_SIZE - LINE_WIDTH) / 2);
// Top and vertical centre of a comment's avatar, measured from the top of its row.
export const AVATAR_TOP = ROW_PADDING_Y + AVATAR_OFFSET_TOP;
export const AVATAR_CENTER_Y = AVATAR_TOP + AVATAR_SIZE / 2;

const LINE_BASE = "absolute box-border pointer-events-none border-0 border-solid";
// 🎨 CUSTOMIZATION: Threading line color (Default: gray-300)
const LINE_CLASS = `${LINE_BASE} border-gray-300 dark:border-neutral-500`;
// 🎨 CUSTOMIZATION: A comment's line (and its replies' elbows) while hovered
const HOVER_LINE_CLASS = `${LINE_BASE} border-gray-900 dark:border-white`;
// 🎨 CUSTOMIZATION: Connector into the highlighted comment (Default: blue-500)
const ACCENT_LINE_CLASS = `${LINE_BASE} border-blue-500 dark:border-blue-400`;

/**
 * A comment's line: whether the mouse is on it, and its collapse toggle. The
 * comment provides it; its own line segment, its direct replies' elbows and
 * the elbow into its reply form read it, so they light up together. Deeper
 * replies read their own parent's line instead.
 */
export interface ThreadLine {
  hovered: boolean;
  setHovered: (hovered: boolean) => void;
  toggle: () => void;
}

export const ThreadLineContext = createContext<ThreadLine | null>(null);

// How far the line's hover/click area reaches on each side of it
const HIT_REACH = 8;

function lineClass(line: ThreadLine | null | undefined, accent = false) {
  if (line?.hovered) return HOVER_LINE_CLASS;
  return accent ? ACCENT_LINE_CLASS : LINE_CLASS;
}

/** An invisible area over a piece of line: hovering it lights the line, clicking collapses. */
function LineHitArea({
  line,
  style,
}: {
  line: ThreadLine | null | undefined;
  style: React.CSSProperties;
}) {
  if (!line) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute cursor-pointer"
      style={style}
      onMouseEnter={() => line.setHovered(true)}
      onMouseLeave={() => line.setHovered(false)}
      onClick={line.toggle}
    />
  );
}

/** The hit area of a vertical piece of line at `x`. */
function verticalHit(x: number, block: React.CSSProperties): React.CSSProperties {
  return {
    insetInlineStart: `${x - HIT_REACH}px`,
    width: `${LINE_WIDTH + 2 * HIT_REACH}px`,
    ...block,
  };
}

// The collapse circle's size
const CIRCLE_SIZE = 16;

/**
 * The circle on a comment's line: ⊖ collapses the comment, ⊕ expands it. It
 * marks the line; clicking the line itself does the same. Positioned by the
 * caller (`style`) so its center sits on the line.
 */
export function ThreadCollapseButton({
  line,
  collapsed,
  className,
  style,
}: {
  line: ThreadLine;
  collapsed: boolean;
  /** Its background: the row's, so the line seems to pass behind it */
  className?: string;
  style: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      aria-label={collapsed ? strings.expandThread : strings.collapseThread}
      onClick={(event) => {
        event.stopPropagation();
        line.toggle();
      }}
      onMouseEnter={() => line.setHovered(true)}
      onMouseLeave={() => line.setHovered(false)}
      className={cn(
        // 🎨 CUSTOMIZATION: Collapse circle styling
        "absolute z-10 flex items-center justify-center rounded-full border border-solid p-0 cursor-pointer",
        line.hovered
          ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
          : "border-gray-400 text-gray-500 dark:border-neutral-400 dark:text-neutral-400",
        className
      )}
      style={{ width: `${CIRCLE_SIZE}px`, height: `${CIRCLE_SIZE}px`, ...style }}
    >
      {/* Drawn, not typed: a glyph sits wherever the font puts it, off center */}
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M1 4h6" />
        {collapsed ? <path d="M4 1v6" /> : null}
      </svg>
    </button>
  );
}

/**
 * Where the circle goes so its center sits on the line, measured from the
 * start edge of the element it is placed in. `offset` is how far that
 * element's start edge is from the comment row's start edge.
 */
export function circleInlineStart(offset: number) {
  return `${RAIL_X + LINE_WIDTH / 2 - CIRCLE_SIZE / 2 - offset}px`;
}

/**
 * The line from under a comment's avatar to the bottom of its row, where the
 * lines of the rows below take over. Rendered inside the comment's row.
 */
export function ThreadStem({ line }: { line?: ThreadLine | null }) {
  const block = { top: `${AVATAR_TOP + AVATAR_SIZE}px`, bottom: 0 };
  return (
    <>
      <div
        className={lineClass(line)}
        style={{
          insetInlineStart: `${RAIL_X}px`,
          ...block,
          borderInlineStartWidth: `${LINE_WIDTH}px`,
        }}
      />
      <LineHitArea line={line} style={verticalHit(RAIL_X, block)} />
    </>
  );
}

interface IndentationThreadingLinesProps {
  /** Nothing hangs from the parent's line below this row. */
  isLastReply: boolean;
  /**
   * The row sits one level in from its parent (the default). False past the
   * indentation cap, where replies stay in their parent's column.
   */
  indented?: boolean;
  /** Where the elbow meets the row, measured from the top of the row. */
  joinAt?: number;
  /** How far past the row's start edge the elbow runs. */
  reach?: number;
  /** The row is the highlighted comment: its connector takes the accent color. */
  highlighted?: boolean;
  /** The parent's line, which these pieces belong to. */
  line?: ThreadLine | null;
}

/**
 * Connects one row to its parent. Rendered inside the row's wrapper, which
 * must be `relative` and span the row plus everything nested under it.
 * Wrappers stack with no space between them, so their line segments add up
 * to one unbroken line at any content height.
 */
function IndentationThreadingLines({
  isLastReply,
  indented = true,
  joinAt = AVATAR_CENTER_Y,
  reach = 0,
  highlighted = false,
  line,
}: IndentationThreadingLinesProps) {
  // The piece that leads into this row; the line carrying on past it stays neutral
  const ownLineClass = lineClass(line, highlighted);
  const carryOnClass = lineClass(line);

  // Past the indentation cap: a straight line through the column, from the
  // row above into this avatar and, if more rows follow, on past it.
  if (!indented) {
    return (
      <>
        <div
          className={ownLineClass}
          style={{
            insetInlineStart: `${RAIL_X}px`,
            top: 0,
            height: `${AVATAR_TOP}px`,
            borderInlineStartWidth: `${LINE_WIDTH}px`,
          }}
        />
        <LineHitArea
          line={line}
          style={verticalHit(RAIL_X, { top: 0, height: `${AVATAR_TOP}px` })}
        />
        {!isLastReply && (
          <>
            <div
              className={carryOnClass}
              style={{
                insetInlineStart: `${RAIL_X}px`,
                top: `${AVATAR_TOP + AVATAR_SIZE}px`,
                bottom: 0,
                borderInlineStartWidth: `${LINE_WIDTH}px`,
              }}
            />
            <LineHitArea
              line={line}
              style={verticalHit(RAIL_X, {
                top: `${AVATAR_TOP + AVATAR_SIZE}px`,
                bottom: 0,
              })}
            />
          </>
        )}
      </>
    );
  }

  return (
    <>
      {/* The parent's line carrying on to the rows below */}
      {!isLastReply && (
        <>
          <div
            className={carryOnClass}
            style={{
              insetInlineStart: `${RAIL_X - INDENT}px`,
              top: 0,
              bottom: 0,
              borderInlineStartWidth: `${LINE_WIDTH}px`,
            }}
          />
          <LineHitArea
            line={line}
            style={verticalHit(RAIL_X - INDENT, { top: 0, bottom: 0 })}
          />
        </>
      )}

      {/* The parent's line down to this row, turning into it: one shape, so
          the vertical part and the curve can't come apart */}
      <div
        className={ownLineClass}
        style={{
          insetInlineStart: `${RAIL_X - INDENT}px`,
          top: 0,
          width: `${INDENT - RAIL_X + reach}px`,
          height: `${Math.ceil(joinAt + LINE_WIDTH / 2)}px`,
          borderInlineStartWidth: `${LINE_WIDTH}px`,
          borderBottomWidth: `${LINE_WIDTH}px`,
          borderEndStartRadius: `${ELBOW_RADIUS}px`,
        }}
      />
      {/* The elbow's hit areas: its vertical part, then the part turning in */}
      <LineHitArea
        line={line}
        style={verticalHit(RAIL_X - INDENT, {
          top: 0,
          height: `${Math.ceil(joinAt + LINE_WIDTH / 2)}px`,
        })}
      />
      <LineHitArea
        line={line}
        style={{
          insetInlineStart: `${RAIL_X - INDENT}px`,
          width: `${INDENT - RAIL_X + reach}px`,
          top: `${Math.ceil(joinAt - HIT_REACH)}px`,
          height: `${2 * HIT_REACH}px`,
        }}
      />
    </>
  );
}

export default IndentationThreadingLines;
