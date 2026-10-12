import { View } from "react-native";
import { CommentSkeleton } from "@sublay/ui-core-react-native";

function FetchingCommentsSkeletons() {
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
        <CommentSkeleton key={i} />
      ))}
    </View>
  );
}

export default FetchingCommentsSkeletons;
