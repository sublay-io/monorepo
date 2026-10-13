// 🎨 CUSTOMIZATION: Thread geometry. Every connector line is derived from
// these values, so changing one keeps the joins intact.

// 🎨 CUSTOMIZATION: Avatar size (Default: 24px)
export const AVATAR_SIZE = 24;
// 🎨 CUSTOMIZATION: Indentation per reply level (Default: 24px).
// Keep it larger than half the avatar, or the elbows have no room.
export const INDENT = 24;
// 🎨 CUSTOMIZATION: Levels that indent; deeper replies stay in one column (Default: 6)
export const MAX_INDENT_DEPTH = 6;
// 🎨 CUSTOMIZATION: Vertical padding of a comment row (Default: 8px)
export const ROW_PADDING_Y = 8;
// 🎨 CUSTOMIZATION: Space between the top of a row's content and its avatar (Default: 4px)
export const AVATAR_OFFSET_TOP = 4;
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
// 🎨 CUSTOMIZATION: Connector into the highlighted comment (Default: blue-500)
const ACCENT_LINE_CLASS = `${LINE_BASE} border-blue-500 dark:border-blue-400`;

/**
 * The line from under a comment's avatar to the bottom of its row, where the
 * lines of the rows below take over. Rendered inside the comment's row.
 */
export function ThreadStem() {
  return (
    <div
      className={LINE_CLASS}
      style={{
        insetInlineStart: `${RAIL_X}px`,
        top: `${AVATAR_TOP + AVATAR_SIZE}px`,
        bottom: 0,
        borderInlineStartWidth: `${LINE_WIDTH}px`,
      }}
    />
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
}: IndentationThreadingLinesProps) {
  // The piece that leads into this row; the line carrying on past it stays neutral
  const ownLineClass = highlighted ? ACCENT_LINE_CLASS : LINE_CLASS;

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
        {!isLastReply && (
          <div
            className={LINE_CLASS}
            style={{
              insetInlineStart: `${RAIL_X}px`,
              top: `${AVATAR_TOP + AVATAR_SIZE}px`,
              bottom: 0,
              borderInlineStartWidth: `${LINE_WIDTH}px`,
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* The parent's line carrying on to the rows below */}
      {!isLastReply && (
        <div
          className={LINE_CLASS}
          style={{
            insetInlineStart: `${RAIL_X - INDENT}px`,
            top: 0,
            bottom: 0,
            borderInlineStartWidth: `${LINE_WIDTH}px`,
          }}
        />
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
    </>
  );
}

export default IndentationThreadingLines;
