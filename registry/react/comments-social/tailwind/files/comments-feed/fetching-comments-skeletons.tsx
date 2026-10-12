import { CommentSkeleton } from "~shared/react/skeleton";

function FetchingCommentsSkeletons() {
  return (
    // Sized and spaced like the comment rows they stand in for
    <div className="flex flex-col gap-7 bg-white dark:bg-neutral-800 m-0 pt-2 pb-6 pr-[42px]">
      {[1, 2, 3].map((i) => (
        <CommentSkeleton lineGap={18} key={i} />
      ))}
    </div>
  );
}

export default FetchingCommentsSkeletons;
