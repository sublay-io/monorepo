import { CommentSkeleton } from "~shared/react/skeleton";

function FetchingCommentsSkeletons() {
  return (
    <div className="flex flex-col gap-2 bg-white dark:bg-neutral-800 m-0 pb-6 pr-4 pl-4">
      {[1, 2, 3].map((i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}

export default FetchingCommentsSkeletons;
