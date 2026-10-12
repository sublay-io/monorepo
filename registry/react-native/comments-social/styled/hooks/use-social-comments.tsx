import { ComponentProps, ReactNode, useMemo } from "react";
import {
  CommentsSortByOptions,
  CommentSectionProvider,
  Entity,
} from "@sublay/react-native";
import { UIStateProvider } from "../context/ui-state-context";

import CommentsFeed from "../files/comments-feed/comments-feed";
import NewCommentForm from "../files/new-comment-form/new-comment-form";
import SortByButton from "../files/sort-by-button/sort-by-button";
import CommentOptionsSheet from "../files/sheets/comment-options-sheet";
import CommentOptionsSheetOwner from "../files/sheets/comment-options-sheet-owner";
import ReportCommentSheet from "../files/sheets/report-comment-sheet";

type SocialCommentSectionProviderProps = Omit<
  ComponentProps<typeof CommentSectionProvider>,
  "children"
> & {
  theme?: "light" | "dark";
};

// The provider the section renders inside. It is defined here, outside the
// hook, so it is the same component on every render: a component created
// inside the hook would be a new component type whenever it was created
// again, and React would unmount the whole section (loaded comments,
// expanded replies, reply drafts). Everything that can change reaches it as
// props, built by the hook below as `providerProps`.
function SocialCommentSectionProvider({
  children,
  theme,
  ...sectionProps
}: SocialCommentSectionProviderProps & { children: ReactNode }) {
  return (
    <CommentSectionProvider {...sectionProps}>
      <UIStateProvider theme={theme}>
        <>
          {children}
          <CommentOptionsSheet />
          <CommentOptionsSheetOwner />
          <ReportCommentSheet />
        </>
      </UIStateProvider>
    </CommentSectionProvider>
  );
}

function useSocialComments({
  entity,
  entityId,
  foreignId,
  shortId,
  createIfNotFound,
  highlightedCommentId,
  theme = 'light',
  defaultSortBy,
  limit,
}: {
  entity?: Entity;
  entityId?: string | undefined | null;
  foreignId?: string | undefined | null;
  shortId?: string | undefined | null;
  createIfNotFound?: boolean;
  highlightedCommentId?: string | null;
  theme?: 'light' | 'dark';
  defaultSortBy?: CommentsSortByOptions;
  limit?: number;
}) {
  // 🔧 CUSTOMIZE: Callback handlers for user interactions
  // Replace these placeholder implementations with your own logic
  const callbacks = useMemo(() => ({
    // Called when a user tries to perform an action without being logged in
    loginRequiredCallback: () => {
      // 🔧 CUSTOMIZE: Handle login requirement
      // Example: navigation.navigate('Login')
      console.log("Please login to perform this action");
    },

    // Called when a user tries to perform an action without having a username set
    usernameRequiredCallback: () => {
      // 🔧 CUSTOMIZE: Handle username requirement
      // Example: navigation.navigate('ProfileSetup')
      console.log("Username required");
    },

    // Called when a user tries to submit an empty comment or reply
    commentTooShortCallback: () => {
      // 🔧 CUSTOMIZE: Handle empty comment validation
      console.log("Comment cannot be empty");
    },

    // Called when trying to mention a user who doesn't have a username
    userCantBeMentionedCallback: () => {
      // 🔧 CUSTOMIZE: Handle mention validation
      console.log("This user doesn't have a username and cannot be mentioned");
    },

    // Called when the current user clicks on their own avatar or name
    currentUserClickCallback: () => {
      // 🔧 CUSTOMIZE: Handle current user profile click
      // Example: navigation.navigate('Profile')
      console.log("Navigate to own profile");
    },

    // Called when clicking on another user's avatar or name
    // @param userId - The user's ID
    // @param foreignId - Optional foreign ID if the user has one
    otherUserClickCallback: (userId: string, foreignId: string | undefined) => {
      // 🔧 CUSTOMIZE: Handle other user profile click
      // Example: navigation.navigate('UserProfile', { userId })
      console.log(`Navigate to user ${userId} profile`, { foreignId });
    },
  }), []);

  // The props for `CommentSectionProvider` (returned below). Spread them onto
  // it: `<CommentSectionProvider {...providerProps}>`.
  const providerProps: SocialCommentSectionProviderProps = useMemo(
    () => ({
      entity,
      entityId,
      foreignId,
      shortId,
      createIfNotFound,
      callbacks: callbacks as Record<string, (...args: any[]) => void>,
      highlightedCommentId,
      theme,
      defaultSortBy: defaultSortBy || "top",
      // The heart is the `like` reaction, so "Top" ranks by likes. The
      // reaction only applies while the sort is `top` and replies inherit it.
      defaultSortByReaction: "like",
      limit: limit || 10,
    }),
    [
      entity,
      entityId,
      foreignId,
      shortId,
      createIfNotFound,
      callbacks,
      defaultSortBy,
      limit,
      highlightedCommentId,
      theme,
    ]
  );

  return useMemo(
    () => ({
      CommentSectionProvider: SocialCommentSectionProvider,
      providerProps,
      CommentsFeed,
      NewCommentForm,
      SortByButton,
    }),
    [providerProps]
  );
}

export default useSocialComments;
