import { useCommentSection } from "@sublay/react-js";
import Modal from "~shared/react/modal";
import { resetUl } from "~shared/react/reset-styles";
import useUIState from "../../../hooks/use-ui-state";

function CommentMenuModalOwner() {
  const {
    optionsComment,
    isCommentMenuModalOwnerOpen,
    closeCommentMenuModalOwner,
  } = useUIState();

  const { deleteComment } = useCommentSection();

  const handleDeleteComment = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );
    if (userConfirmed && optionsComment) {
      closeCommentMenuModalOwner?.();
      await deleteComment?.({ commentId: optionsComment.id });
    } else {
      closeCommentMenuModalOwner?.();
    }
  };

  return (
    <Modal
      show={!!isCommentMenuModalOwnerOpen}
      onClose={closeCommentMenuModalOwner}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-60 self-center py-2"
      >
        <ul
          style={resetUl}
          className="w-full"
        >
          <li
            className="flex justify-center justify-self-center"
          >
            <button
              className="font-semibold text-red-600 dark:text-red-400 px-6 py-2 bg-transparent border-none outline-none cursor-pointer"
              onClick={handleDeleteComment}
            >
              Remove
            </button>
          </li>
          <div
            className="h-px w-full bg-gray-200 dark:bg-neutral-600"
          />
          <li
            className="flex justify-center justify-self-center"
          >
            <button
              className="text-gray-900 dark:text-neutral-50 px-6 py-2 bg-transparent border-none outline-none cursor-pointer"
              onClick={closeCommentMenuModalOwner}
            >
              Cancel
            </button>
          </li>
        </ul>
      </div>
    </Modal>
  );
}

export default CommentMenuModalOwner;
