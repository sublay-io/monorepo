import { useUser, Comment as CommentType } from "@sublay/react-js";
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

interface ActionMenuProps {
  comment: CommentType;
}

function ActionMenu({ comment }: ActionMenuProps) {
  const { user } = useUser();

  const { openCommentOptionsModal, openCommentOptionsModalOwner, theme } =
    useUIState();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() =>
          user && user.id === comment.userId
            ? openCommentOptionsModalOwner?.(comment)
            : openCommentOptionsModal?.(comment)
        }
        style={{
          padding: "4px",
          color: theme === 'dark' ? "#737373" : "#9CA3AF",
          transition:
            "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out",
          borderRadius: "4px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#4B5563";
          e.currentTarget.style.backgroundColor = theme === 'dark' ? "#404040" : "#F3F4F6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = theme === 'dark' ? "#737373" : "#9CA3AF";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title={strings.moreOptions}
      >
        <svg
          style={{ width: "16px", height: "16px", display: "block" }}
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
