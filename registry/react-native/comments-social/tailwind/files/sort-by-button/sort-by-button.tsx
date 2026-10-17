import { ReactNode } from "react";
import { TouchableOpacity } from "react-native";
import { CommentsSortByOptions, useCommentSection } from "@sublay/react-native";

function SortByButton({
  priority,
  sortDir = "desc",
  activeView,
  nonActiveView,
}: {
  priority: CommentsSortByOptions;
  // The direction this option sorts in (defaults to "desc"). The section's
  // direction carries over between sorts, so each option sets its own; it
  // isn't sent for "controversial", which ranks one way only.
  sortDir?: "asc" | "desc";
  activeView: ReactNode;
  nonActiveView: ReactNode;
}) {
  const {
    sortBy,
    setSortBy,
    sortDir: currentSortDir,
    setSortDir,
  } = useCommentSection();

  // Active only when both the sort and its direction match (New and Old share
  // `createdAt` and differ only in direction).
  const isActive = sortBy === priority && currentSortDir === sortDir;

  const handlePress = () => {
    setSortBy!(priority);
    setSortDir!(sortDir);
  };

  return (
    <TouchableOpacity
      className="bg-transparent border-0 p-0 m-0"
      onPress={handlePress}
    >
      {isActive ? activeView : nonActiveView}
    </TouchableOpacity>
  );
}

export default SortByButton;
