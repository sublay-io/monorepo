/**
 * Sublay Social Comment Section (Tailwind Variant)
 *
 * A complete social-style comment system with likes, replies, and moderation.
 * Instagram-inspired design with hearts, avatars, and nested replies.
 *
 * Installation: npx @sublay/cli add comments-social
 *
 * Required dependencies:
 * - @sublay/react-js ^8.0.0-beta.0
 * - moment ^2 (used by the shared pieces in shared/)
 * - @giphy/js-fetch-api ^5.7.0 (used by the shared pieces in shared/)
 * - @giphy/react-components ^10.1.1 (used by the shared pieces in shared/)
 * - Tailwind CSS configured with dark mode support
 *
 * @see https://docs.sublay.io/v8/components/components/social/overview
 *
 * ========================
 * TAILWIND CONFIGURATION
 * ========================
 *
 * This component uses Tailwind CSS with native dark mode support.
 * Dark mode is triggered via the `dark:` prefix when a parent element has the `.dark` class.
 *
 * Required tailwind.config.js settings:
 * ```js
 * module.exports = {
 *   darkMode: 'class', // Enable class-based dark mode
 *   // ... other config
 * }
 * ```
 *
 * TAILWIND CLASSES USED:
 *
 * BACKGROUNDS:
 * - bg-white dark:bg-neutral-800 (main background)
 * - bg-gray-50 dark:bg-neutral-700 (secondary background, hover states)
 * - bg-gray-200 dark:bg-neutral-600 (sort buttons inactive, dividers)
 * - bg-black dark:bg-neutral-800 (sort buttons active)
 *
 * TEXT:
 * - text-gray-900 dark:text-neutral-50 (primary text - author names, headings)
 * - text-gray-900 dark:text-neutral-200 (comment body)
 * - text-gray-500 dark:text-neutral-400 (secondary text - timestamps, reply button)
 * - text-gray-600 dark:text-neutral-400 (tertiary text - likes count)
 * - text-white dark:text-neutral-50 (sort button active text)
 *
 * BORDERS:
 * - border-gray-200 dark:border-neutral-600 (borders, dividers)
 *
 * BLUES (post button, links):
 * - text-blue-600 dark:text-blue-400 (primary blue - post button)
 *
 * REDS (heart icon, destructive actions):
 * - text-red-600 dark:text-red-400 (danger actions)
 */
import React from "react";
import { CommentsSortByOptions, Entity } from "@sublay/react-js";
import useSocialComments from "../hooks/use-social-comments";
import { SortByButton } from "./sort-by-button";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form";
import { deepEqual, warnPropChanges } from "../utils/prop-comparison";

interface SocialCommentSectionProps {
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
  prevProps: SocialCommentSectionProps,
  nextProps: SocialCommentSectionProps
): boolean => {
  // Add development warnings for unnecessary prop changes
  warnPropChanges("SocialCommentSection", prevProps, nextProps, [
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

// 🎨 CUSTOMIZATION: Dark-mode colors of the shared pieces (GIF picker, loading
// skeletons, emoji bar divider, mentions). The pieces in `shared/` read these
// CSS custom properties, so they follow the `dark` class like the rest of the
// section. Keep these classes on an element that wraps the feed and the form.
const sharedDarkColors = [
  "dark:[--sublay-ui-surface:#262626]",
  "dark:[--sublay-ui-control:#404040]",
  "dark:[--sublay-ui-muted:#a3a3a3]",
  "dark:[--sublay-ui-text:#fafafa]",
  "dark:[--sublay-ui-divider:#525252]",
  "dark:[--sublay-ui-skeleton:#404040]",
  "dark:[--sublay-ui-mention:#60a5fa]",
].join(" ");

function SocialCommentSectionInner({
  isVisible,
  children,
}: {
  isVisible: boolean;
  children?: React.ReactNode;
}) {

  // 🔧 CUSTOMIZE: Sort options for comments
  // "Top" ranks by likes (the heart); "New" and "Old" are both the
  // `createdAt` sort, differing only by direction.
  // Remove or reorder these options as needed.
  const sortOptions: Array<{
    label: string;
    sortBy: CommentsSortByOptions;
    sortDir?: "asc" | "desc";
  }> = [
    { label: "Top", sortBy: "top", sortDir: "desc" },
    { label: "New", sortBy: "createdAt", sortDir: "desc" },
    { label: "Old", sortBy: "createdAt", sortDir: "asc" },
  ];

  const renderSortButtons = () => {
    return sortOptions.map(({ label, sortBy, sortDir }) => {
      return (
        <SortByButton
          key={`${sortBy}:${sortDir ?? ""}`}
          priority={sortBy}
          sortDir={sortDir}
          activeView={
            <div className="bg-black px-2 py-1 rounded-md text-white text-xs">
              {label}
            </div>
          }
          nonActiveView={
            <div className="bg-gray-200 dark:bg-neutral-600 px-2 py-1 rounded-md text-gray-900 dark:text-neutral-50 text-xs">
              {label}
            </div>
          }
        />
      );
    });
  };

  return (
    // Positioned, so the GIF picker covers the comment section and no more
    <div className={`relative h-full flex flex-col ${sharedDarkColors}`}>
      {sortOptions.length > 0 && (
        <div
          className="flex px-6 py-3 items-center gap-1 justify-end bg-white dark:bg-neutral-800"
        >
          {renderSortButtons()}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800"
      >
        <CommentsFeed>{children}</CommentsFeed>
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-600">
        {isVisible && <NewCommentForm />}
      </div>
    </div>
  );
}

function SocialCommentSection({
  entity,
  entityId,
  foreignId,
  shortId,
  createIfNotFound,
  isVisible = true,
  highlightedCommentId,
  children,
}: SocialCommentSectionProps) {
  const { CommentSectionProvider, providerProps } = useSocialComments({
    entity,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,
    highlightedCommentId,
  });

  return (
    <CommentSectionProvider {...providerProps}>
      <SocialCommentSectionInner
        isVisible={isVisible}
      >
        {children}
      </SocialCommentSectionInner>
    </CommentSectionProvider>
  );
}

export default React.memo(SocialCommentSection, arePropsEqual);
