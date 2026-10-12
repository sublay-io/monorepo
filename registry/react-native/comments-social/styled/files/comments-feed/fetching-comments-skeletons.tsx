import { FlatList, View } from "react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";

const FetchingCommentsSkeletons = () => {
  const { theme } = useUIState();
  // 🎨 CUSTOMIZATION: Comments gap (spacing between skeletons)
  const commentsGap = 8;

  return (
    <FlatList
      data={[1, 2, 3]}
      renderItem={() => <CommentSkeleton theme={theme} />}
      keyExtractor={(item) => item.toString()}
      ItemSeparatorComponent={() => <View style={{ height: commentsGap }} />}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: 24,
        paddingRight: 16,
        paddingLeft: 16,
      }}
      keyboardShouldPersistTaps="always"
    />
  );
};

export default FetchingCommentsSkeletons;
