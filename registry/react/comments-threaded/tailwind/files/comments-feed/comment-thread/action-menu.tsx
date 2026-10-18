import { useUser, Comment as CommentType } from "@sublay/react-js";
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

interface ActionMenuProps {
  comment: CommentType;
}

function ActionMenu({ comment }: ActionMenuProps) {
  const { user } = useUser();
  const { openCommentOptionsModal, openCommentOptionsModalOwner } = useUIState();

  return (
    <div className="relative">
      <button
        onClick={() =>
          user && user.id === comment.userId
            ? openCommentOptionsModalOwner?.(comment)
            : openCommentOptionsModal?.(comment)
        }
        className="p-1 text-gray-400 dark:text-neutral-500 transition-colors duration-150 rounded bg-transparent border-none cursor-pointer hover:text-gray-600 dark:hover:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700"
        title={strings.moreOptions}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </div>
  );
}

export default ActionMenu;
