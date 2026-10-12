import { resetButton } from "@sublay/ui-core-react-js";
import useUIState from "../../../../hooks/use-ui-state";

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

  const mutedColor = theme === 'dark' ? '#A3A3A3' : '#737373';

  if (failed && hasMore) {
    return (
      <div
        style={{
          paddingTop: 8,
          paddingLeft: 56,
          paddingRight: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ height: 1, width: 24, marginTop: "2px", backgroundColor: mutedColor }} />
        <span style={{ fontSize: 12, color: mutedColor }}>
          Couldn't load more ·{" "}
          <button
            onClick={() => {
              setAreRepliesVisible(true);
              onLoadMore();
            }}
            style={{ ...resetButton, fontSize: 12, fontWeight: 600, color: mutedColor }}
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
      style={{
        ...resetButton,
        // 🎨 CUSTOMIZATION: Show/hide button styling (Default: 8px top padding)
        paddingTop: 8,
        paddingLeft: 56,
        paddingRight: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Button line */}
      <div
        style={{
          height: 1,
          width: 24,
          marginTop: "2px",
          // 🎨 CUSTOMIZATION: Line and text color
          backgroundColor: theme === 'dark' ? '#A3A3A3' : '#737373',
        }}
      />
      {/* Button text */}
      <span style={{
        fontSize: 12,
        color: theme === 'dark' ? '#A3A3A3' : '#737373',
        fontWeight: 600
      }}>
        {text}
      </span>
    </button>
  );
};

export default ShowHideButton;
