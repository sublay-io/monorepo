import { TouchableOpacity, View, Text } from "react-native";
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

  // CUSTOMIZATION: Show/hide button styling defaults
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

  const mutedTextClass = theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500';

  if (failed && hasMore) {
    return (
      <View className="pt-2 ps-[58px] pe-4 flex-row items-center gap-3">
        <View
          className={`h-px w-6 mt-0.5 ${
            theme === 'dark' ? 'bg-neutral-400' : 'bg-neutral-500'
          }`}
        />
        <View className="flex-row items-center">
          <Text className={`text-xs ${mutedTextClass}`}>{strings.loadMoreFailed} · </Text>
          <TouchableOpacity
            onPress={() => {
              setAreRepliesVisible(true);
              onLoadMore();
            }}
          >
            <Text className={`text-xs font-semibold ${mutedTextClass}`}>
              {strings.tryAgain}
            </Text>
          </TouchableOpacity>
        </View>
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
      className="bg-transparent border-0 p-0 m-0 pt-2 ps-[58px] pe-4 flex-row items-center gap-3"
    >
      <View
        className={`h-px w-6 mt-0.5 ${
          theme === 'dark' ? 'bg-neutral-400' : 'bg-neutral-500'
        }`}
      />
      <Text
        className={`text-xs font-semibold ${
          theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
        }`}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default ShowHideButton;
