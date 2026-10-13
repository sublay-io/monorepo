import { Text, View } from "react-native";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <View>
      <Text
        className={`text-center text-lg font-bold mb-2 ${
          theme === 'dark' ? 'text-neutral-50' : 'text-black'
        }`}
      >
        {strings.noCommentsTitle}
      </Text>
      <Text
        className={`text-center text-xs mt-0 ${
          theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
        }`}
      >
        {strings.noCommentsSubtitle}
      </Text>
    </View>
  );
}

export default NoCommentsPlaceHolder;
