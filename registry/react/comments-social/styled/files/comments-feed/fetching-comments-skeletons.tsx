import { resetDiv } from "~shared/react/reset-styles";
import { CommentSkeleton } from "~shared/react/skeleton";
import useUIState from "../../hooks/use-ui-state";

function FetchingCommentsSkeletons() {
  const { theme } = useUIState();

  return (
    <div
      style={{
        ...resetDiv,
        display: "flex",
        flexDirection: "column",
        // 🎨 CUSTOMIZATION: Feed background and gap (Default: white, 8px gap)
        // Sized and spaced like the comment rows they stand in for
        gap: 28,
        backgroundColor: theme === 'dark' ? '#262626' : '#fff',
        paddingTop: 8,
        paddingBottom: 24,
        paddingRight: 42,
      }}
    >
      {[1, 2, 3].map((i) => (
        <CommentSkeleton theme={theme} lineGap={18} key={i} />
      ))}
    </div>
  );
}

export default FetchingCommentsSkeletons;
