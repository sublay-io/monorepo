/**
 * Sublay Threaded Comment Section (Tailwind Variant)
 *
 * A complete threaded comment system with upvotes/downvotes, nested replies, and moderation.
 *
 * Installation: npx @sublay/cli add comments-threaded
 *
 * Required dependencies:
 * - @sublay/react-js ^8.0.0-beta.0
 * - @sublay/ui-core-react-js ^7.0.0
 *
 * Requires Tailwind CSS with dark mode enabled in tailwind.config.js:
 * - darkMode: 'class' or darkMode: 'media'
 *
 * @see https://docs.sublay.io/v8/components/components/threaded/overview
 *
 * ====================
 * TAILWIND COLOR CLASSES
 * ====================
 *
 * This component uses Tailwind CSS classes with dark: prefix for dark mode support.
 * All colors use standard Tailwind palette (gray-50 through gray-900, blue-500, red-500, etc.)
 *
 * BACKGROUNDS:
 * - bg-white dark:bg-neutral-800 (main background)
 * - bg-gray-50 dark:bg-neutral-700 (secondary background, hover states)
 * - bg-blue-50 dark:bg-blue-950 (blue hover backgrounds)
 * - bg-red-50 dark:bg-red-950 (red hover backgrounds)
 * - bg-gray-100 dark:bg-[#333333] (highlighted comment background)
 * - bg-blue-100 dark:bg-blue-900 (indentation beside a highlighted comment)
 *
 * TEXT:
 * - text-gray-900 dark:text-neutral-50 (primary text)
 * - text-gray-800 dark:text-neutral-200 (body text)
 * - text-gray-700 dark:text-neutral-300 (author names, secondary text)
 * - text-gray-600 dark:text-neutral-400 (hover text)
 * - text-gray-500 dark:text-neutral-400 (timestamps, tertiary text)
 * - text-gray-400 dark:text-neutral-500 (disabled states)
 *
 * BORDERS:
 * - border-gray-200 dark:border-neutral-600 (primary borders)
 * - border-gray-300 dark:border-neutral-500 (threading lines, secondary borders)
 *
 * BLUES (links, actions, upvotes):
 * - text-blue-600 dark:text-blue-400 (primary blue)
 * - bg-blue-600 dark:bg-blue-500 (buttons)
 * - hover:bg-blue-700 dark:hover:bg-blue-600 (button hover)
 *
 * REDS (downvotes, destructive actions):
 * - text-red-600 dark:text-red-400 (primary red)
 * - bg-red-600 dark:bg-red-500 (destructive buttons)
 */
import React from "react";
import { Entity } from "@sublay/react-js";
import useThreadedComments from "../hooks/use-threaded-comments";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form";
import { deepEqual, warnPropChanges } from "../utils/prop-comparison";

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
    prevProps.highlightedCommentId !== nextProps.highlightedCommentId
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
  return (
    <div className="h-full flex flex-col">
      <div
        className={
          // 🎨 CUSTOMIZATION: Layout styling
          "flex-1 overflow-y-auto bg-white dark:bg-neutral-800 py-2"
        }
      >
        <CommentsFeed>{children}</CommentsFeed>
      </div>

      <div
        className={
          // 🎨 CUSTOMIZATION: Layout styling
          "border-t border-gray-200 dark:border-neutral-600 pt-2"
        }
      >
        {isVisible && <NewCommentForm />}
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
  children,
}: ThreadedCommentSectionProps) {
  const { CommentSectionProvider, providerProps } = useThreadedComments({
    entity,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,
    highlightedCommentId,
  });

  return (
    <CommentSectionProvider {...providerProps}>
      <ThreadedCommentSectionInner isVisible={isVisible}>
        {children}
      </ThreadedCommentSectionInner>
    </CommentSectionProvider>
  );
}

export default React.memo(ThreadedCommentSection, arePropsEqual);
