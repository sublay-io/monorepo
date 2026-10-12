import { TouchableOpacity, Text } from "react-native";
import useUIState from "../../../../hooks/use-ui-state";

function ToggleRepliesVisibility({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { theme } = useUIState();

  return (
    <TouchableOpacity
      onPress={onToggleCollapse}
      style={{
        marginLeft: 4,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        // 🎨 CUSTOMIZATION: Toggle background, and its border while collapsed
        backgroundColor: theme === 'dark' ? '#404040' : '#F9FAFB',
        borderWidth: isCollapsed ? 1 : 0,
        borderColor: theme === 'dark' ? '#737373' : '#D1D5DB',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '700',
          color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
        }}
      >
        {isCollapsed ? "+" : "−"}
      </Text>
    </TouchableOpacity>
  );
}

export default ToggleRepliesVisibility;
