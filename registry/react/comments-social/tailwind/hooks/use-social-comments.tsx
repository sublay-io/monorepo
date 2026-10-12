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

type SocialCommentSectionProviderProps = Omit<
  ComponentProps<typeof CommentSectionProvider>,
  "children"
>;

// The provider the section renders inside. It is defined here, outside the
// hook, so it is the same component on every render: a component created
// inside the hook would be a new component type whenever it was created
// again, and React would unmount the whole section (loaded comments,
// expanded replies, reply drafts). Everything that can change reaches it as
// props, built by the hook below as `providerProps`.
function SocialCommentSectionProvider({
  children,
  ...sectionProps
}: SocialCommentSectionProviderProps & { children: ReactNode }) {
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

function useSocialComments({
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
  const callbacks = useMemo(() => ({
    // Called when a user tries to perform an action without being logged in
    loginRequiredCallback: () => {
      // 🔧 CUSTOMIZE: Handle login requirement
      // Example: router.push('/login?redirect=' + window.location.pathname)
      alert("Please login to perform this action");
    },

    // Called when a user tries to perform an action without having a username set
    usernameRequiredCallback: () => {
      // 🔧 CUSTOMIZE: Handle username requirement
      // Example: router.push('/profile/setup')
      console.log("Username required");
    },

    // Called when a user tries to submit an empty comment or reply
    commentTooShortCallback: () => {
      // 🔧 CUSTOMIZE: Handle empty comment validation
      alert("Comment cannot be empty");
    },

    // Called when trying to mention a user who doesn't have a username
    userCantBeMentionedCallback: () => {
      // 🔧 CUSTOMIZE: Handle mention validation
      alert("This user doesn't have a username and cannot be mentioned");
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
    otherUserClickCallback: (userId: string, foreignId: string | undefined) => {
      // 🔧 CUSTOMIZE: Handle other user profile click
      // Example: router.push(`/users/${userId}`)
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
      defaultSortBy: "top",
      // The heart is the `like` reaction, so "Top" ranks by likes. The
      // reaction only applies while the sort is `top` and replies inherit it.
      defaultSortByReaction: "like",
      limit: 10,
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
      CommentSectionProvider: SocialCommentSectionProvider,
      providerProps,
      CommentsFeed,
      NewCommentForm,
    }),
    [providerProps]
  );
}

export default useSocialComments;
