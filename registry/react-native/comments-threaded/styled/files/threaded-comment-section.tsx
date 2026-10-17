/**
 * Sublay Threaded Comment Section (React Native)
 *
 * A complete threaded comment system with upvotes/downvotes, nested replies, and moderation.
 *
 * Installation: npx @sublay/cli add comments-threaded
 *
 * Three pieces, placed by your screen. The section has no scrolling of its
 * own: put it in your screen's scroll view, so what's above it (the entity)
 * scrolls away with the comments.
 *
 *   <ThreadedComments foreignId={entity.foreignId}>
 *     <ScrollView keyboardShouldPersistTaps="handled">
 *       <YourEntity />
 *       <ThreadedCommentSection />     // Sort by + the comments
 *     </ScrollView>
 *     <ThreadedCommentInput />         // the comment box, here pinned below
 *   </ThreadedComments>
 *
 * ThreadedComments holds the shared state and renders the sheets (sort,
 * comment options, report) over the view it wraps, normally the whole screen.
 * Keyboard handling (KeyboardAvoidingView or your library) is up to the screen.
 *
 * Required dependencies:
 * - @sublay/react-native ^8.0.0-beta.0
 * - react-native-svg ^15 (used by the shared pieces in shared/)
 * - @gorhom/bottom-sheet
 *
 * @see https://docs.sublay.io/v8/components/components/threaded/overview
 *
 * ====================
 * THEME COLOR PALETTE
 * ====================
 *
 * This component supports light and dark themes via the `theme` prop.
 * Use theme === 'dark' ? DARK_COLOR : LIGHT_COLOR for conditional styling.
 *
 * BACKGROUNDS:
 * - #FFFFFF → #262626 (main background)
 * - #F9FAFB → #404040 (secondary background, vote buttons)
 * - #F3F4F6 → #333333 (highlighted comment background)
 * - #DBEAFE → #172554 (indentation beside a highlighted comment)
 * - #E5E7EB → #525252 (vote buttons on a highlighted comment)
 *
 * TEXT:
 * - #111827 → #FAFAFA (primary text)
 * - #1F2937 → #E5E5E5 (body text)
 * - #374151 → #D4D4D4 (secondary text)
 * - #374151 → #FFFFFF (author names)
 * - #6B7280 → #A3A3A3 (timestamps, tertiary text)
 *
 * BORDERS:
 * - #E5E7EB → #525252 (primary borders)
 * - #D1D5DB → #737373 (threading lines)
 *
 * BLUES (links, actions, upvotes):
 * - #2563EB → #60A5FA (primary blue)
 * - #3B82F6 → #60A5FA (active upvote)
 *
 * REDS (downvotes, destructive actions):
 * - #DC2626 → #F87171 (primary red)
 * - #EF4444 → #F87171 (active downvote)
 */
import React, { useContext } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { Entity } from "@sublay/react-native";
import useThreadedComments from "../hooks/use-threaded-comments";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form/new-comment-form";
import SortByTrigger from "./sort-by-trigger/sort-by-trigger";
import { deepEqual, warnPropChanges } from "../utils/prop-comparison";
import useUIState from "../hooks/use-ui-state";
import { UIStateContext } from "../context/ui-state-context";
import { SECTION_PADDING_X } from "./comments-feed/comment-thread/single-comment/indentation-threading-lines";

interface ThreadedCommentsProps {
  entity?: Entity | undefined | null;
  entityId?: string | undefined | null;
  foreignId?: string | undefined | null;
  shortId?: string | undefined | null;
  /**
   * With `foreignId`: create the entity the first time the section is shown
   * if none exists yet. Off by default — the section then only finds an
   * existing entity.
   */
  createIfNotFound?: boolean;
  highlightedCommentId?: string | undefined | null;
  theme?: 'light' | 'dark';
  /** Your screen: it holds ThreadedCommentSection and ThreadedCommentInput. */
  children?: React.ReactNode;
}

// Re-renders when a prop changes. `children` is the screen, so in practice it
// re-renders whenever the screen does; the sections inside read context.
const arePropsEqual = (
  prevProps: ThreadedCommentsProps,
  nextProps: ThreadedCommentsProps
): boolean => {
  // Add development warnings for unnecessary prop changes
  warnPropChanges("ThreadedComments", prevProps, nextProps, ["entity"]);

  // Compare primitive values
  if (
    prevProps.entityId !== nextProps.entityId ||
    prevProps.foreignId !== nextProps.foreignId ||
    prevProps.shortId !== nextProps.shortId ||
    prevProps.createIfNotFound !== nextProps.createIfNotFound ||
    prevProps.highlightedCommentId !== nextProps.highlightedCommentId ||
    prevProps.theme !== nextProps.theme
  ) {
    return false;
  }

  // Deep compare entity objects for more accurate comparison
  if (!deepEqual(prevProps.entity, nextProps.entity)) {
    return false;
  }

  // Compare children (reference comparison for React nodes)
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  return true;
};

/**
 * Wraps the screen: the shared state of the comment section, and the sheets
 * over the screen. Renders a `flex: 1` view, which the sheets cover.
 */
function ThreadedCommentsBase({
  entity,
  entityId,
  foreignId,
  shortId,
  createIfNotFound,
  highlightedCommentId,
  theme = 'light',
  children,
}: ThreadedCommentsProps) {
  const { CommentSectionProvider, providerProps } = useThreadedComments({
    entity: entity ?? undefined,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,
    theme,
    highlightedCommentId,
  });

  return (
    <CommentSectionProvider {...providerProps}>{children}</CommentSectionProvider>
  );
}

export const ThreadedComments = React.memo(ThreadedCommentsBase, arePropsEqual);

// The section and the input only work inside ThreadedComments, which holds
// their shared state.
function useInsideThreadedComments(name: string) {
  const { focusCommentInput } = useContext(UIStateContext);
  if (!focusCommentInput) {
    throw new Error(`${name} must be rendered inside <ThreadedComments>.`);
  }
}

/**
 * Sort by and the comments. No scrolling of its own: put it in your screen's
 * scroll view. `children` replaces the "no comments yet" view.
 */
function ThreadedCommentSection({ children }: { children?: React.ReactNode }) {
  useInsideThreadedComments("ThreadedCommentSection");
  const { theme } = useUIState();

  return (
    <View
      style={{
        paddingVertical: 8,
        // 🎨 CUSTOMIZATION: Feed background
        backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
        // The side padding is on this view, so a highlighted comment can
        // reach back across it to the section's edges
        paddingHorizontal: SECTION_PADDING_X,
      }}
    >
      <SortByTrigger />
      <CommentsFeed>{children}</CommentsFeed>
    </View>
  );
}

/**
 * The comment box, with the "Replying to" bar: Reply on a comment focuses it.
 * Place it anywhere inside ThreadedComments, typically pinned below your
 * scroll view. It never focuses itself when the screen opens.
 */
export function ThreadedCommentInput({
  containerStyle,
}: {
  // Style for the view around the box (default: a top border on the
  // section's background)
  containerStyle?: StyleProp<ViewStyle>;
}) {
  useInsideThreadedComments("ThreadedCommentInput");
  const { theme } = useUIState();

  return (
    <NewCommentForm
      containerStyle={
        containerStyle ?? {
          borderTopWidth: 1,
          paddingTop: 8,
          // 🎨 CUSTOMIZATION: Comment box border and background
          borderTopColor: theme === 'dark' ? '#525252' : '#E5E7EB',
          backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
        }
      }
    />
  );
}

export default ThreadedCommentSection;
