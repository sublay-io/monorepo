import { CommentSkeleton } from "~shared/react/skeleton";

function FetchingCommentsSkeletons() {
  return (
    <div className="grid gap-2 pb-6 px-4">
      {[1, 2, 3].map((i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}

export default FetchingCommentsSkeletons;
