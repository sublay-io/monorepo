/**
 * Sublay Social Comment Section (React Native - Tailwind)
 *
 * A complete social-style comment system with likes, replies, and moderation.
 * Instagram-inspired design with hearts, avatars, and nested replies.
 *
 * Installation: npx @sublay/cli add comments-social
 *
 * Required dependencies:
 * - @sublay/react-native ^8.0.0-beta.0
 * - @sublay/ui-core-react-native ^7.0.0
 * - @gorhom/bottom-sheet
 * - nativewind ^4.0.0
 *
 * @see https://docs.sublay.io/v8/components/components/social/overview
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
 * - bg-gray-100 / dark:bg-neutral-700 (secondary background, hover states)
 * - bg-gray-200 / dark:bg-neutral-600 (sort buttons inactive)
 * - bg-black / dark:bg-neutral-800 (sort buttons active background)
 *
 * TEXT:
 * - text-black / dark:text-neutral-50 (primary text - author names, comment body)
 * - text-neutral-500 / dark:text-neutral-400 (secondary text - timestamps, reply button)
 * - text-white / dark:text-neutral-50 (sort button active text)
 *
 * BORDERS:
 * - border-gray-200 / dark:border-neutral-600 (borders, dividers)
 *
 * BLUES (post button, links):
 * - text-sky-500 / dark:text-blue-400 (primary blue - post button)
 *
 * REDS (heart icon, destructive actions):
 * - text-red-600 / dark:text-red-400 (filled heart, danger)
 */
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CommentsSortByOptions, Entity } from "@sublay/react-native";
import useSocialComments from "../hooks/use-social-comments";
import SortByButton from "./sort-by-button/sort-by-button";
import CommentsFeed from "./comments-feed/comments-feed";
import NewCommentForm from "./new-comment-form/new-comment-form";
import { deepEqual, warnPropChanges } from "../utils/prop-comparison";
import useUIState from "../hooks/use-ui-state";

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
  children,
}: {
  isVisible: boolean;
  children?: React.ReactNode;
}) {
  const { theme } = useUIState();

  // CUSTOMIZE: Sort options for comments
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
    return sortOptions.map(({ label, sortBy, sortDir }, index) => {
      const isFirst = index === 0;

      return (
        <SortByButton
          key={`${sortBy}:${sortDir ?? ""}`}
          priority={sortBy}
          sortDir={sortDir}
          activeView={
            <TouchableOpacity
              className={`py-1 px-2 rounded-md ${isFirst ? '' : 'ml-1'} ${
                theme === 'dark' ? 'bg-neutral-800' : 'bg-black'
              }`}
            >
              <Text className={`text-xs ${
                theme === 'dark' ? 'text-neutral-50' : 'text-white'
              }`}>
                {label}
              </Text>
            </TouchableOpacity>
          }
          nonActiveView={
            <TouchableOpacity
              className={`py-1 px-2 rounded-md ${isFirst ? '' : 'ml-1'} ${
                theme === 'dark' ? 'bg-neutral-600' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-xs ${
                theme === 'dark' ? 'text-neutral-50' : 'text-black'
              }`}>
                {label}
              </Text>
            </TouchableOpacity>
          }
        />
      );
    });
  };

  return (
    <View className="flex-1">
      {sortOptions.length > 0 && (
        <View className="flex-row px-6 py-3 items-center justify-end">
          {renderSortButtons()}
        </View>
      )}

      <ScrollView
        className={`flex-1 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-white'}`}
      >
        <CommentsFeed>{children}</CommentsFeed>
      </ScrollView>

      <View
        className={`border-t ${
          theme === 'dark' ? 'border-neutral-600' : 'border-gray-200'
        }`}
      >
        {isVisible && <NewCommentForm />}
      </View>
    </View>
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
  theme = 'light',
  children,
}: SocialCommentSectionProps) {
  const { CommentSectionProvider, providerProps } = useSocialComments({
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
      <SocialCommentSectionInner isVisible={isVisible}>
        {children}
      </SocialCommentSectionInner>
    </CommentSectionProvider>
  );
}

export default React.memo(SocialCommentSection, arePropsEqual);
