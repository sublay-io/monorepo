/**
 * Sublay Social Comment Section
 *
 * A complete social-style comment system with likes, replies, and moderation.
 * Instagram-inspired design with hearts, avatars, and nested replies.
 *
 * @see https://docs.sublay.io/v8/components/components/social/overview
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
 * - #e5e7eb → #4B5563 (sort buttons inactive)
 * - #000000 → #1F2937 (sort buttons active background)
 *
 * TEXT:
 * - #000 → #F9FAFB (primary text - author names, comment body)
 * - #737373 → #9CA3AF (secondary text - timestamps, reply button)
 * - #8E8E8E → #9CA3AF (tertiary text - likes count)
 * - #FFFFFF → #F9FAFB (sort button active text)
 *
 * BORDERS:
 * - #e5e7eb → #4B5563 (borders, dividers)
 *
 * BLUES (post button, links):
 * - #0A99F6 → #60A5FA (primary blue - post button)
 * - #3B82F6 → #60A5FA (hover states)
 *
 * REDS (heart icon, destructive actions):
 * - #DC2626 → #F87171 (filled heart, danger)
 * - #8E8E8E → #9CA3AF (empty heart)
 */
import React from "react";
import { CommentsSortByOptions, Entity } from "@sublay/react-js";
import useSocialComments from "../hooks/use-social-comments";
import { SortByButton } from "./sort-by-button";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form";
import { deepEqual, warnPropChanges } from "../utils/prop-comparison";
import useUIState from "../hooks/use-ui-state";
import strings from "../utils/strings";

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

function SocialCommentSectionInner({
  isVisible,
  gifPickerFullScreen,
  children,
}: {
  isVisible: boolean;
  gifPickerFullScreen: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = useUIState();

  // 🔧 CUSTOMIZE: Sort options for comments
  // "Top" ranks by likes (the heart); "New" and "Old" are both the
  // `createdAt` sort, differing only by direction.
  // Remove or reorder these options as needed.
  const sortOptions: Array<{
    label: string;
    sortBy: CommentsSortByOptions;
    sortDir?: "asc" | "desc";
  }> = [
    { label: strings.sortTop, sortBy: "top", sortDir: "desc" },
    { label: strings.sortNew, sortBy: "createdAt", sortDir: "desc" },
    { label: strings.sortOld, sortBy: "createdAt", sortDir: "asc" },
  ];

  const buttonStyles = {
    active: {
      // 🎨 CUSTOMIZATION: Sort button active styles
      backgroundColor: 'black',
      padding: "4px 8px",
      borderRadius: "6px",
      color: 'white',
      fontSize: "12px",
    },
    inactive: {
      // 🎨 CUSTOMIZATION: Sort button inactive styles
      backgroundColor: theme === 'dark' ? '#525252' : '#e5e7eb',
      padding: "4px 8px",
      borderRadius: "6px",
      color: theme === 'dark' ? '#FAFAFA' : '#000000',
      fontSize: "12px",
    },
  };

  const renderSortButtons = () => {
    return sortOptions.map(({ label, sortBy, sortDir }) => {
      return (
        <SortByButton
          key={`${sortBy}:${sortDir ?? ""}`}
          priority={sortBy}
          sortDir={sortDir}
          activeView={<div style={buttonStyles.active}>{label}</div>}
          nonActiveView={<div style={buttonStyles.inactive}>{label}</div>}
        />
      );
    });
  };

  return (
    // Positioned, so the GIF picker covers exactly the comment section
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {sortOptions.length > 0 && (
        <div
          style={{
            display: "flex",
            // 🎨 CUSTOMIZATION: Header padding (Default: 24px horizontal, 12px vertical)
            paddingInlineStart: "24px",
            paddingInlineEnd: "24px",
            paddingTop: "12px",
            paddingBottom: "12px",
            alignItems: "center",
            gap: "4px",
            justifyContent: "flex-end",
            backgroundColor: theme === 'dark' ? "#262626" : "white",
          }}
        >
          {renderSortButtons()}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          // 🎨 CUSTOMIZATION: Feed background (Default: white)
          backgroundColor: theme === 'dark' ? "#262626" : "white",
        }}
      >
        <CommentsFeed>{children}</CommentsFeed>
      </div>

      <div style={{
        // 🎨 CUSTOMIZATION: Form border color
        borderTop: theme === 'dark' ? "1px solid #525252" : "1px solid #e5e7eb"
      }}>
        {isVisible && (
          <NewCommentForm gifPickerFullScreen={gifPickerFullScreen} />
        )}
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
  gifPickerFullScreen = false,
  highlightedCommentId,
  theme = 'light',
  children,
}: SocialCommentSectionProps) {
  const { CommentSectionProvider, providerProps } = useSocialComments({
    entity,
    entityId,
    foreignId,
    shortId,
    createIfNotFound,
    theme,
    highlightedCommentId,
  });

  return (
    <CommentSectionProvider {...providerProps}>
      <SocialCommentSectionInner
        isVisible={isVisible}
        gifPickerFullScreen={gifPickerFullScreen}
      >
        {children}
      </SocialCommentSectionInner>
    </CommentSectionProvider>
  );
}

export default React.memo(SocialCommentSection, arePropsEqual);
