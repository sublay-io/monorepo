import { CommentSkeleton } from "~shared/react/skeleton";

function FetchingCommentsSkeletons() {
  return (
    // Sized and spaced like the comment rows they stand in for
    <div className="grid gap-[45px] pt-3 pb-6">
      {[1, 2, 3].map((i) => (
        <CommentSkeleton
          avatarSize={24}
          gap={12}
          lineGap={12}
          paddingLeft={0}
          key={i}
        />
      ))}
    </div>
  );
}

export default FetchingCommentsSkeletons;
