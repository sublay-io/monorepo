import { Text, View } from "react-native";
import useUIState from "../../hooks/use-ui-state";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <View>
      <Text
        className={`text-center text-lg font-bold mb-2 ${
          theme === 'dark' ? 'text-neutral-200' : 'text-gray-800'
        }`}
      >
        No comments yet
      </Text>
      <Text
        className={`text-center text-[13px] leading-[18px] mt-0 ${
          theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
        }`}
      >
        Start the conversation.
      </Text>
    </View>
  );
}

export default NoCommentsPlaceHolder;
