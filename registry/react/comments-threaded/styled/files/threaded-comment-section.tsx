/**
 * Sublay Threaded Comment Section
 *
 * A complete threaded comment system with upvotes/downvotes, nested replies, and moderation.
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
 * - #FFFFFF → #1F2937 (main background)
 * - #F3F4F6 → #374151 (secondary background, hover states)
 * - #EFF6FF → #1E3A8A (blue hover backgrounds)
 * - #FEF2F2 → #7F1D1D (red hover backgrounds)
 * - #F3F4F6 → #2B3544 (highlighted comment background)
 * - #DBEAFE → #1E3A8A (indentation beside the highlighted comment)
 * - #3B82F6 → #60A5FA (connector line into the highlighted comment)
 *
 * TEXT:
 * - #111827 → #F9FAFB (primary text)
 * - #1F2937 → #E5E7EB (body text)
 * - #374151 → #D1D5DB (secondary text)
 * - #374151 → #FFFFFF (author names)
 * - #4B5563 → #9CA3AF (hover text)
 * - #6B7280 → #9CA3AF (timestamps, tertiary text)
 * - #8e8e8e → #9CA3AF (placeholder text)
 * - #9CA3AF → #6B7280 (disabled states)
 * - #000000 → #FFFFFF (report modal elements)
 *
 * BORDERS:
 * - #E5E7EB → #4B5563 (primary borders)
 * - #D1D5DB → #6B7280 (threading lines, secondary borders)
 * - #e7e7e7 → #4B5563 (dividers)
 *
 * BLUES (links, actions, upvotes):
 * - #3B82F6 → #60A5FA (primary blue)
 * - #2563EB → #3B82F6 (buttons)
 * - #1D4ED8 → #2563EB (button hover)
 * - #BFDBFE → #1E40AF (active borders)
 *
 * REDS (downvotes, destructive actions):
 * - #EF4444 → #F87171 (primary red)
 * - #DC2626 → #EF4444 (destructive buttons)
 */
import React from "react";
import { Entity } from "@sublay/react-js";
import useThreadedComments from "../hooks/use-threaded-comments";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form";
import SortByDropdown from "./sort-by-dropdown";
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
  children,
}: {
  isVisible: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = useUIState();

  return (
    // No scrolling of its own: the section is as tall as its comments, and the
    // page it sits in scrolls
    <div>
      {/* The new-comment box comes first, above the comments */}
      {isVisible && (
        <div
          style={{
            backgroundColor: theme === 'dark' ? "#262626" : "#fff",
            // 🎨 CUSTOMIZATION: Layout styling (Default: 12px 16px 8px)
            padding: `12px ${SECTION_PADDING_X}px 8px`,
          }}
        >
          <NewCommentForm />
        </div>
      )}

      {/* Sort by, between the comment box and the comments */}
      <div
        style={{
          backgroundColor: theme === 'dark' ? "#262626" : "#fff",
          // 🎨 CUSTOMIZATION: Layout styling (Default: 4px 16px)
          padding: `4px ${SECTION_PADDING_X}px`,
        }}
      >
        <SortByDropdown />
      </div>

      <div
        style={{
          // 🎨 CUSTOMIZATION: Layout styling (Default: white)
          backgroundColor: theme === 'dark' ? "#262626" : "#fff",
          // 🎨 CUSTOMIZATION: Layout styling (Default: 8px)
          paddingTop: "8px",
          paddingBottom: "8px",
          paddingLeft: `${SECTION_PADDING_X}px`,
          paddingRight: `${SECTION_PADDING_X}px`,
        }}
      >
        <CommentsFeed>{children}</CommentsFeed>
      </div>
    </div>
  );
}

function ThreadedCommentSection({
  entity,
  entityId,
  foreignId,
  shortId,
  createIfNotFound,
  isVisible = true,
  highlightedCommentId,
  theme = 'light',
  children,
}: ThreadedCommentSectionProps) {
  const { CommentSectionProvider, providerProps } = useThreadedComments({
    entity,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,
    highlightedCommentId,
    theme,
  });

  return (
    <CommentSectionProvider {...providerProps}>
      <ThreadedCommentSectionInner
        isVisible={isVisible}
      >
        {children}
      </ThreadedCommentSectionInner>
    </CommentSectionProvider>
  );
}

export default React.memo(ThreadedCommentSection, arePropsEqual);
