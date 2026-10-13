/**
 * Sublay Threaded Comment Section (React Native)
 *
 * A complete threaded comment system with upvotes/downvotes, nested replies, and moderation.
 *
 * Installation: npx @sublay/cli add comments-threaded
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
 * - #374151 → #D4D4D4 (author names, secondary text)
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
import React from "react";
import { View, ScrollView } from "react-native";
import { Entity } from "@sublay/react-native";
import useThreadedComments from "../hooks/use-threaded-comments";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form/new-comment-form";
import { deepEqual, warnPropChanges } from "../utils/prop-comparison";
import useUIState from "../hooks/use-ui-state";
import { SECTION_PADDING_X } from "./comments-feed/comment-thread/single-comment/indentation-threading-lines";

interface ThreadedCommentSectionProps {
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
  isVisible?: boolean;
  /**
   * Where the GIF picker opens. Off by default: it covers the comment
   * section. On: it covers the whole screen.
   */
  gifPickerFullScreen?: boolean;
  highlightedCommentId?: string | undefined | null;
  theme?: 'light' | 'dark';
  children?: React.ReactNode;
}

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (
  prevProps: ThreadedCommentSectionProps,
  nextProps: ThreadedCommentSectionProps
): boolean => {
  // Add development warnings for unnecessary prop changes
  warnPropChanges("ThreadedCommentSection", prevProps, nextProps, [
    "entity",
  ]);

  // Compare primitive values
  if (
    prevProps.entityId !== nextProps.entityId ||
    prevProps.foreignId !== nextProps.foreignId ||
    prevProps.shortId !== nextProps.shortId ||
    prevProps.createIfNotFound !== nextProps.createIfNotFound ||
    prevProps.isVisible !== nextProps.isVisible ||
    prevProps.gifPickerFullScreen !== nextProps.gifPickerFullScreen ||
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

function ThreadedCommentSectionInner({
  isVisible,
  gifPickerFullScreen,
  children,
}: {
  isVisible: boolean;
  gifPickerFullScreen: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = useUIState();

  const formContainerStyle = {
    borderTopWidth: 1,
    paddingTop: 8,
    // 🎨 CUSTOMIZATION: Form border and background
    borderTopColor: theme === 'dark' ? '#525252' : '#E5E7EB',
    backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
  };

  return (
    // The GIF picker fills the view it is rendered in, and the form renders
    // it. So the form is a direct child of this root view, with no wrapper
    // around it: the picker then covers exactly the comment section.
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{
          flex: 1,
          paddingVertical: 8,
          // 🎨 CUSTOMIZATION: Feed background
          backgroundColor: theme === 'dark' ? '#262626' : '#FFFFFF',
        }}
        // The side padding is on the content, not on the scroll view, so a
        // highlighted comment can reach back across it to the section's edges
        contentContainerStyle={{ paddingHorizontal: SECTION_PADDING_X }}
        keyboardShouldPersistTaps="handled"
      >
        <CommentsFeed>{children}</CommentsFeed>
      </ScrollView>

      {isVisible ? (
        <NewCommentForm
          gifPickerFullScreen={gifPickerFullScreen}
          containerStyle={formContainerStyle}
        />
      ) : (
        <View style={formContainerStyle} />
      )}
    </View>
  );
}

function ThreadedCommentSection({
  entity,
  entityId,
  foreignId,
  shortId,
  createIfNotFound,
  isVisible = true,
  gifPickerFullScreen = false,
  highlightedCommentId,
  theme = 'light',
  children,
}: ThreadedCommentSectionProps) {
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
    <CommentSectionProvider {...providerProps}>
      <ThreadedCommentSectionInner
        isVisible={isVisible}
        gifPickerFullScreen={gifPickerFullScreen}
      >
        {children}
      </ThreadedCommentSectionInner>
    </CommentSectionProvider>
  );
}

export default React.memo(ThreadedCommentSection, arePropsEqual);
