import { TouchableOpacity, View, Text } from "react-native";
import { resetButton } from "~shared/react-native/reset-styles";
import useUIState from "../../../../hooks/use-ui-state";
import strings from "../../../../utils/strings";

const ShowHideButton = ({
  totalRepliesCount,
  loadedRepliesCount,
  page,
  hasMore,
  failed,
  onLoadMore,
  areRepliesVisible,
  setAreRepliesVisible,
}: {
  totalRepliesCount: number;
  loadedRepliesCount: number;
  page: number;
  hasMore: boolean;
  /** The last replies load failed: show a retry instead. */
  failed: boolean;
  onLoadMore: () => void;
  areRepliesVisible: boolean;
  setAreRepliesVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { theme } = useUIState();

  // 🎨 CUSTOMIZATION: Show/hide button styling defaults
  const viewRepliesPaddingTop = 8;
  const hideRepliesText = strings.hideReplies;

  let action: ("show" | "hide" | "load-more")[] = [];
  let text = "";

  switch (true) {
    // This case is if the replies were never expanded before (page === 0)
    case !areRepliesVisible && page === 0:
      action = ["show", "load-more"];
      text = strings.viewMoreReplies(totalRepliesCount);
      break;

    // This case is if the replies have been shown previously but are now hidden (user had to load all before hiding)
    case !areRepliesVisible && page > 0:
      action = ["show"];
      text = strings.viewMoreReplies(totalRepliesCount);
      break;

    // This case is if the replies are visible and there are more replies to load
    case areRepliesVisible && hasMore:
      action = ["load-more"];
      text = strings.viewMoreReplies(Math.max(0, totalRepliesCount - loadedRepliesCount));
      break;

    // This case is if the replies are visible and all of them have been loaded
    case areRepliesVisible && !hasMore:
      action = ["hide"];
      text = hideRepliesText;
      break;
  }

  if (totalRepliesCount === 0) return null;

  const mutedColor = theme === 'dark' ? '#A3A3A3' : '#737373';

  if (failed && hasMore) {
    return (
      <View
        style={{
          paddingTop: viewRepliesPaddingTop,
          paddingStart: 58,
          paddingEnd: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ height: 1, width: 24, marginTop: 2, backgroundColor: mutedColor }} />
        <Text style={{ fontSize: 12, color: mutedColor }}>{strings.loadMoreFailed} · </Text>
        <TouchableOpacity
          onPress={() => {
            setAreRepliesVisible(true);
            onLoadMore();
          }}
          style={resetButton}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor }}>
            {strings.tryAgain}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => {
        if (action.includes("show")) setAreRepliesVisible(true);
        if (action.includes("hide")) setAreRepliesVisible(false);
        if (action.includes("load-more") && hasMore) onLoadMore();
      }}
      style={{
        ...resetButton,
        paddingTop: viewRepliesPaddingTop,
        paddingStart: 58,
        paddingEnd: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          height: 1,
          width: 24,
          marginTop: 2,
          // 🎨 CUSTOMIZATION: Line color
          backgroundColor: theme === 'dark' ? '#A3A3A3' : '#737373',
        }}
      />
      <Text style={{
        fontSize: 12,
        fontWeight: '600',
        // 🎨 CUSTOMIZATION: Text color
        color: theme === 'dark' ? '#A3A3A3' : '#737373',
      }}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default ShowHideButton;
