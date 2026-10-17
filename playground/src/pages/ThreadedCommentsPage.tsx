import ThreadedCommentSectionStyled from "../../../registry/react/comments-threaded/styled/files/threaded-comment-section";
import ThreadedCommentSectionTailwind from "../../../registry/react/comments-threaded/tailwind/files/threaded-comment-section";
import CommentsPlayground from "../components/CommentsPlayground";

export default function ThreadedCommentsPage() {
  return (
    <CommentsPlayground
      foreignId="playground-threaded-comments"
      maxWidth={700}
      scrollsWithPage
      Styled={ThreadedCommentSectionStyled}
      Tailwind={ThreadedCommentSectionTailwind}
    />
  );
}
