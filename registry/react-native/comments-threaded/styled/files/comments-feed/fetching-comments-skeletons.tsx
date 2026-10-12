import { View } from "react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";

function FetchingCommentsSkeletons() {
  const { theme } = useUIState();
  return (
    <View
      style={{
        // 🎨 CUSTOMIZATION: Space between skeletons (Default: 8)
        gap: 8,
        paddingBottom: 24,
        paddingHorizontal: 16,
      }}
    >
      {[1, 2, 3].map((i) => (
        <CommentSkeleton theme={theme} key={i} />
      ))}
    </View>
  );
}

export default FetchingCommentsSkeletons;
