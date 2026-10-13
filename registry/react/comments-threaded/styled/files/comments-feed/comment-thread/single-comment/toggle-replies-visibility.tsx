import useUIState from "../../../../hooks/use-ui-state";
import strings from "../../../../utils/strings";

function ToggleRepliesVisibilty({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { theme } = useUIState();

  return (
    <button
      onClick={onToggleCollapse}
      style={{
        marginInlineStart: "4px",
        width: "16px",
        height: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
        backgroundColor: theme === 'dark' ? "#404040" : "#F3F4F6",
        borderRadius: "2px",
        transition: "all 150ms ease-in-out",
        fontSize: "14px",
        fontWeight: "bold",
        border: isCollapsed ? (theme === 'dark' ? "1px solid #737373" : "1px solid #D1D5DB") : "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = theme === 'dark' ? "#D4D4D4" : "#374151";
        e.currentTarget.style.backgroundColor = theme === 'dark' ? "#525252" : "#E5E7EB";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#6B7280";
        e.currentTarget.style.backgroundColor = theme === 'dark' ? "#404040" : "#F3F4F6";
      }}
      title={isCollapsed ? strings.expandThread : strings.collapseThread}
    >
      {isCollapsed ? "+" : "−"}
    </button>
  );
}

export default ToggleRepliesVisibilty;
