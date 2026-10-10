import type { CommentCreateError } from "@sublay/react-js";

// 🎨 CUSTOMIZATION: Messages shown when posting a comment fails
export function getCommentCreateErrorMessage(
  error: Pick<CommentCreateError, "code">
): string {
  if (error.code === "comment/parent-deleted") {
    return "This comment was deleted, so you can't reply to it.";
  }
  if (error.code === "comment/parent-removed") {
    return "This comment was removed, so you can't reply to it.";
  }
  return "Couldn't post your comment. Try again.";
}
