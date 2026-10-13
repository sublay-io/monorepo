import { useCommentSection } from "@sublay/react-js";
import Modal from "~shared/react/modal";
import { resetButton, resetDiv, resetUl } from "~shared/react/reset-styles";
import useUIState from "../../../hooks/use-ui-state";

function CommentMenuModalOwner() {
  const {
    optionsComment,
    isCommentMenuModalOwnerOpen,
    closeCommentMenuModalOwner,
    theme
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
        style={{
          ...resetDiv,
          // 🎨 CUSTOMIZATION: Modal background
          backgroundColor: theme === 'dark' ? '#262626' : 'white',
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
                // 🎨 CUSTOMIZATION: Delete button color (red for danger)
                color: theme === 'dark' ? '#F87171' : '#DC2626',
                paddingInlineStart: 24,
                paddingInlineEnd: 24,
                paddingTop: 8,
                paddingBottom: 8,
              }}
              onClick={handleDeleteComment}
            >
              Remove
            </button>
          </li>
          <div
            style={{
              height: 1,
              width: "100%",
              // 🎨 CUSTOMIZATION: Divider color
              backgroundColor: theme === 'dark' ? '#525252' : '#e7e7e7'
            }}
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
                // 🎨 CUSTOMIZATION: Cancel button color
                color: theme === 'dark' ? '#FAFAFA' : '#000',
                paddingInlineStart: 24,
                paddingInlineEnd: 24,
                paddingTop: 8,
                paddingBottom: 8,
              }}
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
