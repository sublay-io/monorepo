import { View } from "react-native";
import useUIState from "../../../../hooks/use-ui-state";

// 🎨 CUSTOMIZATION: Thread geometry. Every connector line is derived from
// these values, so changing one keeps the joins intact.

// 🎨 CUSTOMIZATION: Avatar size (Default: 24)
export const AVATAR_SIZE = 24;
// 🎨 CUSTOMIZATION: Indentation per reply level (Default: 24).
// Keep it larger than half the avatar, or the elbows have no room.
export const INDENT = 24;
// 🎨 CUSTOMIZATION: Levels that indent; deeper replies stay in one column (Default: 6)
export const MAX_INDENT_DEPTH = 6;
// 🎨 CUSTOMIZATION: Vertical padding of a comment row (Default: 8)
export const ROW_PADDING_Y = 8;
// 🎨 CUSTOMIZATION: Space between the top of a row's content and its avatar (Default: 4)
export const AVATAR_OFFSET_TOP = 4;
// 🎨 CUSTOMIZATION: Gap between the avatar and the comment content (Default: 12)
export const AVATAR_GAP = 12;
// 🎨 CUSTOMIZATION: Space between the comments and the left and right edges
// of the section (Default: 16). The highlight of a comment reaches across it.
export const SECTION_PADDING_X = 16;
// 🎨 CUSTOMIZATION: Threading line thickness (Default: 1)
export const LINE_WIDTH = 1;
// 🎨 CUSTOMIZATION: Roundness of the elbow into each reply (Default: 12)
export const ELBOW_RADIUS = 12;

// Left edge of the vertical line, measured from the left edge of the comment
// it hangs from: centred under that comment's avatar.
export const RAIL_X = Math.floor((AVATAR_SIZE - LINE_WIDTH) / 2);
// Top and vertical centre of a comment's avatar, measured from the top of its row.
export const AVATAR_TOP = ROW_PADDING_Y + AVATAR_OFFSET_TOP;
export const AVATAR_CENTER_Y = AVATAR_TOP + AVATAR_SIZE / 2;

function useLineColors() {
  const { theme } = useUIState();
  return {
    // 🎨 CUSTOMIZATION: Threading line color (Default: #D1D5DB)
    line: theme === 'dark' ? '#737373' : '#D1D5DB',
    // 🎨 CUSTOMIZATION: Connector into the highlighted comment (Default: #3B82F6)
    accent: theme === 'dark' ? '#60A5FA' : '#3B82F6',
  };
}

/**
 * The line from under a comment's avatar to the bottom of its row, where the
 * lines of the rows below take over. Rendered inside the comment's row.
 */
export function ThreadStem() {
  const { line } = useLineColors();

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        borderColor: line,
        left: RAIL_X,
        top: AVATAR_TOP + AVATAR_SIZE,
        bottom: 0,
        width: LINE_WIDTH,
        borderLeftWidth: LINE_WIDTH,
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
  /** How far past the row's left edge the elbow runs. */
  reach?: number;
  /** The row is the highlighted comment: its connector takes the accent color. */
  highlighted?: boolean;
}

/**
 * Connects one row to its parent. Rendered last inside the row's wrapper,
 * which spans the row plus everything nested under it. Wrappers stack with no
 * space between them, so their line segments add up to one unbroken line at
 * any content height.
 */
function IndentationThreadingLines({
  isLastReply,
  indented = true,
  joinAt = AVATAR_CENTER_Y,
  reach = 0,
  highlighted = false,
}: IndentationThreadingLinesProps) {
  const { line, accent } = useLineColors();
  // The piece that leads into this row; the line carrying on past it stays neutral
  const ownLine = highlighted ? accent : line;

  // Past the indentation cap: a straight line through the column, from the
  // row above into this avatar. Each row's own stem carries it on below.
  if (!indented) {
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          borderColor: ownLine,
          left: RAIL_X,
          top: 0,
          height: AVATAR_TOP,
          width: LINE_WIDTH,
          borderLeftWidth: LINE_WIDTH,
        }}
      />
    );
  }

  return (
    <>
      {/* The parent's line carrying on to the rows below */}
      {!isLastReply && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            borderColor: line,
            left: RAIL_X - INDENT,
            top: 0,
            bottom: 0,
            width: LINE_WIDTH,
            borderLeftWidth: LINE_WIDTH,
          }}
        />
      )}

      {/* The parent's line down to this row, turning into it: one shape, so
          the vertical part and the curve can't come apart */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          borderColor: ownLine,
          left: RAIL_X - INDENT,
          top: 0,
          width: INDENT - RAIL_X + reach,
          height: Math.ceil(joinAt + LINE_WIDTH / 2),
          borderLeftWidth: LINE_WIDTH,
          borderBottomWidth: LINE_WIDTH,
          borderBottomLeftRadius: ELBOW_RADIUS,
        }}
      />
    </>
  );
}

export default IndentationThreadingLines;
