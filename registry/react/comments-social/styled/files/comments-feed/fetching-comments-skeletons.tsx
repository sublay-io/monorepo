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
        gap: 8,
        backgroundColor: theme === 'dark' ? '#262626' : '#fff',
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
