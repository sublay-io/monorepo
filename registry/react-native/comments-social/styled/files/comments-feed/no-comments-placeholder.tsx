import { Text, View } from "react-native";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <View>
      <Text
        style={{
          textAlign: "center",
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 8,
          // 🎨 CUSTOMIZATION: Heading color
          color: theme === 'dark' ? '#FAFAFA' : '#000',
        }}
      >
        {strings.noCommentsTitle}
      </Text>
      <Text
        style={{
          textAlign: "center",
          fontSize: 12,
          marginTop: 0,
          // 🎨 CUSTOMIZATION: Subtext color
          color: theme === 'dark' ? '#A3A3A3' : '#8e8e8e',
        }}
      >
        {strings.noCommentsSubtitle}
      </Text>
    </View>
  );
}

export default NoCommentsPlaceHolder;
