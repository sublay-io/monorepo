import { useCommentSection } from "@sublay/react-js";
import Modal from "~shared/react/modal";
import { resetButton, resetDiv, resetUl } from "~shared/react/reset-styles";
import useUIState from "../../../hooks/use-ui-state";
import strings from "../../../utils/strings";

function CommentMenuModalOwner() {
  const {
    optionsComment,
    isCommentOptionsModalOwnerOpen,
    closeCommentOptionsModalOwner,
    theme,
  } = useUIState();

  const { deleteComment } = useCommentSection();

  const handleDeleteComment = async () => {
    const userConfirmed = window.confirm(
      strings.confirmDelete
    );
    if (userConfirmed && optionsComment) {
      closeCommentOptionsModalOwner?.();
      await deleteComment?.({ commentId: optionsComment.id });
    } else {
      closeCommentOptionsModalOwner?.();
    }
  };

  return (
    <Modal
      show={!!isCommentOptionsModalOwnerOpen}
      onClose={closeCommentOptionsModalOwner}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...resetDiv,
          backgroundColor: theme === 'dark' ? "#262626" : "white",
          borderRadius: 8,
          width: "100%",
          maxWidth: 240,
          alignSelf: "center",
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <ul
          style={{
            ...resetUl,
            width: "100%",
          }}
        >
          <li
            style={{
              display: "flex",
              justifyContent: "center",
              justifySelf: "center",
            }}
          >
            <button
              style={{
                ...resetButton,
                fontWeight: 600,
                color: theme === 'dark' ? "#EF4444" : "#DC2626",
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 8,
                paddingBottom: 8,
              }}
              onClick={handleDeleteComment}
            >
              {strings.remove}
            </button>
          </li>
          <div
            style={{ height: 1, width: "100%", backgroundColor: theme === 'dark' ? "#525252" : "#e7e7e7" }}
          />
          <li
            style={{
              display: "flex",
              justifyContent: "center",
              justifySelf: "center",
            }}
          >
            <button
              style={{
                ...resetButton,
                color: theme === 'dark' ? "#D4D4D4" : "#374151", // 🎨 CUSTOMIZATION: Cancel button text color
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 8,
                paddingBottom: 8,
              }}
              onClick={closeCommentOptionsModalOwner}
            >
              {strings.cancel}
            </button>
          </li>
        </ul>
      </div>
    </Modal>
  );
}

export default CommentMenuModalOwner;
