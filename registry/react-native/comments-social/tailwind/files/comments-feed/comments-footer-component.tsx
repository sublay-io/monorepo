import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import useUIState from "../../hooks/use-ui-state";

const CommentsFooterComponent = () => {
  const { hasMore, loading, error, loadMore } = useCommentSection();
  const { theme } = useUIState();

  // A failed page shows a retry; `loadMore()` re-sends the request that failed.
  if (hasMore && !loading && error) {
    const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-neutral-500';
    return (
      <View className="p-3 flex-row justify-center items-center">
        <Text className={`text-xs ${mutedTextClass}`}>Couldn't load more · </Text>
        <TouchableOpacity onPress={() => loadMore?.()}>
          <Text className={`text-xs font-semibold ${mutedTextClass}`}>
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    hasMore &&
    loading && (
      <View className="p-3 justify-center items-center">
        <ActivityIndicator color={theme === 'dark' ? '#F9FAFB' : undefined} />
      </View>
    )
  );
};

export default CommentsFooterComponent;
