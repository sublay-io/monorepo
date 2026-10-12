import { resetButton } from "@sublay/ui-core-react-js";

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

  let action: ("show" | "hide" | "load-more")[] = [];
  let text = "";

  switch (true) {
    // This case is if the replies were never expanded before (page === 0)
    case !areRepliesVisible && page === 0:
      action = ["show", "load-more"];
      // 🎨 CUSTOMIZATION: Text label for "View more replies ($count)"
      text = "View more replies ($count)".replace(
        "$count",
        totalRepliesCount.toString()
      );
      break;

    // This case is if the replies have been shown previously but are now hidden (user had to load all before hiding)
    case !areRepliesVisible && page > 0:
      action = ["show"];
      text = "View more replies ($count)".replace(
        "$count",
        totalRepliesCount.toString()
      );
      break;

    // This case is if the replies are visible and there are more replies to load
    case areRepliesVisible && hasMore:
      action = ["load-more"];
      text = "View more replies ($count)".replace(
        "$count",
        Math.max(0, totalRepliesCount - loadedRepliesCount).toString()
      );
      break;

    // This case is if the replies are visible and all of them have been loaded
    case areRepliesVisible && !hasMore:
      action = ["hide"];
      // 🎨 CUSTOMIZATION: Text label for "Hide replies"
      text = "Hide replies";
      break;
  }

  if (totalRepliesCount === 0) return null;

  if (failed && hasMore) {
    return (
      <div
        style={{ paddingTop: 8, paddingLeft: 56, paddingRight: 16 }}
        className="flex items-center gap-3"
      >
        <div className="h-px w-6 mt-0.5 bg-gray-600 dark:bg-gray-400" />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Couldn't load more ·{" "}
          <button
            onClick={() => {
              setAreRepliesVisible(true);
              onLoadMore();
            }}
            style={resetButton}
            className="text-xs font-semibold text-gray-600 dark:text-gray-400"
          >
            Try again
          </button>
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (action.includes("show")) setAreRepliesVisible(true);
        if (action.includes("hide")) setAreRepliesVisible(false);
        if (action.includes("load-more") && hasMore) onLoadMore();
      }}
      style={{ ...resetButton, paddingTop: 8, paddingLeft: 56, paddingRight: 16 }}
      className="flex items-center gap-3"
    >
      {/* Button line */}
      <div
        className="h-px w-6 mt-0.5 bg-gray-600 dark:bg-gray-400"
      />
      {/* Button text */}
      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
        {text}
      </span>
    </button>
  );
};

export default ShowHideButton;
