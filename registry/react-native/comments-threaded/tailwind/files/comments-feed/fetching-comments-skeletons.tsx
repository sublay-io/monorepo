import { View } from "react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";

function FetchingCommentsSkeletons() {
  const { theme } = useUIState();
  return (
    <View className="gap-2 pb-6 px-4">
      {[1, 2, 3].map((i) => (
        <CommentSkeleton theme={theme} key={i} />
      ))}
    </View>
  );
}

export default FetchingCommentsSkeletons;
