import { Comment as CommentType } from "@sublay/react-js";
import { resetDiv } from "~shared/react/reset-styles";

import CommentThread from "./comment-thread";

function LoadedComments({ data }: { data: CommentType[] }) {
  return (
    <div
      style={{
        ...resetDiv,
        display: "grid",
        gap: "8px",
      }}
    >
      {data?.map((c) => (
        <CommentThread comment={c} depth={0} key={c.id} />
      ))}
    </div>
  );
}

export default LoadedComments;
