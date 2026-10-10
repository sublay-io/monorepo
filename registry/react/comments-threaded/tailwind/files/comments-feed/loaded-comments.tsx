import { Comment as CommentType } from "@sublay/react-js";
import CommentThread from "./comment-thread";

function LoadedComments({ data }: { data: CommentType[] }) {
  return (
    <div className="grid gap-2">
      {data?.map((c) => (
        <CommentThread comment={c} depth={0} key={c.id} />
      ))}
    </div>
  );
}

export default LoadedComments;
