import { resetDiv } from "~shared/react/reset-styles";
import { CommentSkeleton } from "~shared/react/skeleton";
import useUIState from "../../hooks/use-ui-state";

function FetchingCommentsSkeletons() {
  const { theme } = useUIState();
  return (
    <div
      style={{
        ...resetDiv,
        display: "grid",
        // Sized and spaced like the comment rows they stand in for
        gap: "44px",
        paddingTop: 12,
        paddingBottom: 24,
      }}
    >
      {[1, 2, 3].map((i) => (
        <CommentSkeleton
          theme={theme}
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
