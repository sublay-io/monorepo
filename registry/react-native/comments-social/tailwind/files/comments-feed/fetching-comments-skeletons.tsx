import { FlatList, View } from "react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";

const FetchingCommentsSkeletons = () => {
  const { theme } = useUIState();
  return (
    // Sized and spaced like the comment rows they stand in for
    <FlatList
      data={[1, 2, 3]}
      renderItem={() => <CommentSkeleton theme={theme} />}
      keyExtractor={(item) => item.toString()}
      ItemSeparatorComponent={() => <View className="h-7" />}
      className="flex-1"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 24,
        paddingRight: 46,
      }}
      keyboardShouldPersistTaps="always"
    />
  );
};

export default FetchingCommentsSkeletons;
