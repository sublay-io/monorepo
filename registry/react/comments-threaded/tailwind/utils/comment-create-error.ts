import type { CommentCreateError } from "@sublay/react-js";
import strings from "./strings";

// 🎨 CUSTOMIZATION: Messages shown when posting a comment fails
export function getCommentCreateErrorMessage(
  error: Pick<CommentCreateError, "code">
): string {
  if (error.code === "comment/parent-deleted") {
    return strings.parentDeleted;
  }
  if (error.code === "comment/parent-removed") {
    return strings.parentRemoved;
  }
  return strings.postFailed;
}
