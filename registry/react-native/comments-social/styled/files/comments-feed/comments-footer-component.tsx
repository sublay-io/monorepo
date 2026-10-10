import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import useUIState from "../../hooks/use-ui-state";

const CommentsFooterComponent = () => {
  const { hasMore, loading, error, loadMore } = useCommentSection();
  const { theme } = useUIState();

  // A failed page shows a retry; `loadMore()` re-sends the request that failed.
  if (hasMore && !loading && error) {
    const mutedColor = theme === 'dark' ? '#9CA3AF' : '#737373';
    return (
      <View
        style={{
          padding: 12,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 12, color: mutedColor }}>Couldn't load more · </Text>
        <TouchableOpacity onPress={() => loadMore?.()}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor }}>
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    hasMore &&
    loading && (
      <View
        style={{
          padding: 12,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={theme === 'dark' ? '#F9FAFB' : undefined} />
      </View>
    )
  );
};

export default CommentsFooterComponent;
