import { cn } from "@/lib/utils";
import strings from "../../../../utils/strings";

function ToggleRepliesVisibilty({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <button
      onClick={onToggleCollapse}
      className={cn(
        "ms-1 w-4 h-4",
        "flex items-center justify-center",
        "text-gray-500 dark:text-neutral-400",
        "bg-gray-50 dark:bg-neutral-700",
        "rounded-sm",
        "transition-all duration-150",
        "text-sm font-bold",
        "cursor-pointer",
        "hover:text-gray-700 dark:hover:text-neutral-300",
        "hover:bg-gray-200 dark:hover:bg-neutral-600",
        isCollapsed && "border border-gray-300 dark:border-neutral-500"
      )}
      title={isCollapsed ? strings.expandThread : strings.collapseThread}
    >
      {isCollapsed ? "+" : "−"}
    </button>
  );
}

export default ToggleRepliesVisibilty;
