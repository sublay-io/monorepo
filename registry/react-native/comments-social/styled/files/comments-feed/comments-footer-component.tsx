import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

const CommentsFooterComponent = () => {
  const { hasMore, loading, error, loadMore } = useCommentSection();
  const { theme } = useUIState();

  // A failed page shows a retry; `loadMore()` re-sends the request that failed.
  if (hasMore && !loading && error) {
    const mutedColor = theme === 'dark' ? '#A3A3A3' : '#737373';
    return (
      <View
        style={{
          padding: 10.5,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 10.5, lineHeight: 14, color: mutedColor }}>{strings.loadMoreFailed} · </Text>
        <TouchableOpacity onPress={() => loadMore?.()}>
          <Text style={{ fontSize: 10.5, lineHeight: 14, fontWeight: '600', color: mutedColor }}>
            {strings.tryAgain}
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
          padding: 10.5,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={theme === 'dark' ? '#FAFAFA' : undefined} />
      </View>
    )
  );
};

export default CommentsFooterComponent;
