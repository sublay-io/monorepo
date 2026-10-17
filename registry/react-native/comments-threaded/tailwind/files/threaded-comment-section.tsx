/**
 * Sublay Threaded Comment Section (React Native - Tailwind)
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
 *     <ScrollView>
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
 * - nativewind ^4.0.0
 *
 * @see https://docs.sublay.io/v8/components/components/threaded/overview
 *
 * ====================
 * THEME COLOR PALETTE
 * ====================
 *
 * This component supports light and dark themes via the `theme` prop.
 * Tailwind dark mode classes are used for conditional styling.
 *
 * BACKGROUNDS:
 * - bg-white / dark:bg-neutral-800 (main background)
 * - bg-gray-50 / dark:bg-neutral-700 (secondary background, vote buttons)
 * - bg-gray-100 / dark:bg-[#333333] (highlighted comment background)
 * - bg-blue-100 / dark:bg-blue-950 (indentation beside a highlighted comment)
 * - bg-gray-200 / dark:bg-neutral-600 (vote buttons on a highlighted comment)
 *
 * TEXT:
 * - text-gray-900 / dark:text-neutral-50 (primary text)
 * - text-gray-800 / dark:text-neutral-200 (body text)
 * - text-gray-700 / dark:text-neutral-300 (author names, secondary text)
 * - text-gray-500 / dark:text-neutral-400 (timestamps, tertiary text)
 *
 * BORDERS:
 * - border-gray-200 / dark:border-neutral-600 (primary borders)
 * - border-gray-300 / dark:border-neutral-500 (threading lines)
 *
 * BLUES (links, actions, upvotes):
 * - text-blue-600 / dark:text-blue-400 (primary blue)
 * - bg-blue-500 / dark:bg-blue-400 (active upvote)
 *
 * REDS (downvotes, destructive actions):
 * - text-red-600 / dark:text-red-400 (primary red)
 * - bg-red-500 / dark:bg-red-400 (active downvote)
 */
import React, { useContext } from "react";
import { View } from "react-native";
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

// Custom comparison function to prevent unnecessary re-renders
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
      // 🎨 CUSTOMIZATION: Layout styling
      className={`py-2 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-white'}`}
      // The side padding is on this view, so a highlighted comment can reach
      // back across it to the section's edges
      style={{ paddingHorizontal: SECTION_PADDING_X }}
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
  containerClassName,
}: {
  // Classes for the view around the box (default: a top border on the
  // section's background)
  containerClassName?: string;
}) {
  useInsideThreadedComments("ThreadedCommentInput");
  const { theme } = useUIState();

  return (
    <NewCommentForm
      containerClassName={
        containerClassName ??
        // 🎨 CUSTOMIZATION: Comment box container styling
        `border-t pt-2 ${
          theme === 'dark'
            ? 'border-neutral-600 bg-neutral-800'
            : 'border-gray-200 bg-white'
        }`
      }
    />
  );
}

export default ThreadedCommentSection;
