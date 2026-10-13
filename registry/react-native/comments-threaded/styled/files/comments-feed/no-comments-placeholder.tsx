import { Text, View } from "react-native";
import useUIState from "../../hooks/use-ui-state";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 18,
          lineHeight: 28,
          fontWeight: '700',
          marginBottom: 8,
          // 🎨 CUSTOMIZATION: Heading color
          color: theme === 'dark' ? '#E5E5E5' : '#1F2937',
        }}
      >
        No comments yet
      </Text>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 18,
          marginTop: 0,
          // 🎨 CUSTOMIZATION: Subtext color
          color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
        }}
      >
        Start the conversation.
      </Text>
    </View>
  );
}

export default NoCommentsPlaceHolder;
