import { FlatList, View } from "react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";

const FetchingCommentsSkeletons = () => {
  const { theme } = useUIState();
  // Sized and spaced like the comment rows they stand in for
  const commentsGap = 28;

  return (
    <FlatList
      data={[1, 2, 3]}
      renderItem={() => <CommentSkeleton theme={theme} />}
      keyExtractor={(item) => item.toString()}
      ItemSeparatorComponent={() => <View style={{ height: commentsGap }} />}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 24,
        paddingEnd: 46,
      }}
      keyboardShouldPersistTaps="always"
    />
  );
};

export default FetchingCommentsSkeletons;
