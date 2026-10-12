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
        gap: "8px",
        paddingBottom: 24,
        paddingRight: 16,
        paddingLeft: 16,
      }}
    >
      {[1, 2, 3].map((i) => (
        <CommentSkeleton theme={theme} key={i} />
      ))}
    </div>
  );
}

export default FetchingCommentsSkeletons;
