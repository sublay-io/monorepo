import SocialCommentSectionStyled from "../../../../registry/react/comments-social/styled/files/social-comment-section";
import SocialCommentSectionTailwind from "../../../../registry/react/comments-social/tailwind/files/social-comment-section";
import CommentsPlayground from "../components/CommentsPlayground";

export default function SocialCommentsPage() {
  return (
    <CommentsPlayground
      foreignId="playground-social-comments"
      maxWidth={600}
      Styled={SocialCommentSectionStyled}
      Tailwind={SocialCommentSectionTailwind}
    />
  );
}
