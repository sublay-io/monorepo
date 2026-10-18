import { ComponentProps, ReactNode, useMemo } from "react";
import {
  CommentSectionProvider,
  Entity,
} from "@sublay/react-js";
import CommentsFeed from "../files/comments-feed/comments-feed";
import NewCommentForm from "../files/new-comment-form";
import CommentMenuModal from "../files/modals/comment-menu-modal/comment-menu-modal";
import CommentMenuModalOwner from "../files/modals/comment-menu-modal-owner/comment-menu-modal-owner";
import { UIStateProvider } from "../context/ui-state-context";
import strings from "../utils/strings";

type ThreadedCommentSectionProviderProps = Omit<
  ComponentProps<typeof CommentSectionProvider>,
  "children"
>;

// The provider the section renders inside. It is defined here, outside the
// hook, so it is the same component on every render: a component created
// inside the hook would be a new component type whenever it was created
// again, and React would unmount the whole section (loaded comments,
// expanded replies, reply drafts). Everything that can change reaches it as
// props, built by the hook below as `providerProps`.
function ThreadedCommentSectionProvider({
  children,
  ...sectionProps
}: ThreadedCommentSectionProviderProps & { children: ReactNode }) {
  return (
    <CommentSectionProvider {...sectionProps}>
      <UIStateProvider>
        <>
          {children}
          <CommentMenuModal />
          <CommentMenuModalOwner />
        </>
      </UIStateProvider>
    </CommentSectionProvider>
  );
}

function useThreadedComments({
  entity,
  entityId,
  foreignId,
  shortId,
  createIfNotFound,
  highlightedCommentId,
}: {
  entity?: Entity | undefined | null;
  entityId?: string | undefined | null;
  foreignId?: string | undefined | null;
  shortId?: string | undefined | null;
  createIfNotFound?: boolean;
  highlightedCommentId?: string | null;
}) {

  // 🔧 CUSTOMIZE: Callback handlers for user interactions
  // Replace these placeholder implementations with your own logic
  const callbacks = useMemo(
    () => ({
      // Called when a user tries to perform an action without being logged in
      loginRequiredCallback: () => {
        // 🔧 CUSTOMIZE: Handle login requirement
        // Example: router.push('/login?redirect=' + window.location.pathname)
        alert(strings.loginRequired);
      },

      // Called when a user with no username tries to interact with comments
      usernameRequiredCallback: () => {
        // 🔧 CUSTOMIZE: Handle username requirement
        // Example: router.push('/profile/setup')
        alert(strings.usernameRequired);
      },

      // Called when a user tries to submit an empty comment or reply
      commentTooShortCallback: () => {
        // 🔧 CUSTOMIZE: Handle empty comment validation
        alert(strings.commentEmpty);
      },

      // Called when trying to mention a user who doesn't have a username
      userCantBeMentionedCallback: () => {
        // 🔧 CUSTOMIZE: Handle invalid mention attempt
        alert(strings.userNotMentionable);
      },

      // Called when the current user clicks on their own avatar or name
      currentUserClickCallback: () => {
        // 🔧 CUSTOMIZE: Handle current user profile click
        // Example: router.push('/profile')
        console.log("Navigate to own profile");
      },

      // Called when clicking on another user's avatar or name
      // @param userId - The user's ID
      // @param foreignId - Optional foreign ID if the user has one
      otherUserClickCallback: (
        userId: string,
        foreignId: string | undefined
      ) => {
        // 🔧 CUSTOMIZE: Handle other user profile click
        // Example: router.push(`/users/${userId}`)
        console.log(`Navigate to user ${userId} profile`, { foreignId });
      },
    }),
    []
  );
  // The props for `CommentSectionProvider` (returned below). Spread them onto
  // it: `<CommentSectionProvider {...providerProps}>`.
  const providerProps: ThreadedCommentSectionProviderProps = useMemo(
    () => ({
      entity,
      entityId,
      foreignId,
      shortId,
      createIfNotFound,
      callbacks: callbacks as Record<string, (...args: any[]) => void>,
      highlightedCommentId,
      defaultSortBy: "top",
      limit: 10,
      // 🔧 CUSTOMIZE: Replies brought with each page of comments — 2 levels,
      // up to 3 per comment — so the first paint is a single request. Deeper
      // replies load on demand ("N more replies").
      replyDepth: 2,
      replyLimit: 3,
    }),
    [
      entity,
      entityId,
      foreignId,
      shortId,
      createIfNotFound,
      callbacks,
      highlightedCommentId,
    ]
  );

  return useMemo(
    () => ({
      CommentSectionProvider: ThreadedCommentSectionProvider,
      providerProps,
      CommentsFeed,
      NewCommentForm,
    }),
    [providerProps]
  );
}

export default useThreadedComments;
