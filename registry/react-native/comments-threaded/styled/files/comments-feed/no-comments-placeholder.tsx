import { Text, View } from "react-native";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

function NoCommentsPlaceHolder() {
  const { theme } = useUIState();

  return (
    <View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 15.75,
          lineHeight: 24.5,
          fontWeight: '700',
          marginBottom: 7,
          // 🎨 CUSTOMIZATION: Heading color
          color: theme === 'dark' ? '#E5E5E5' : '#1F2937',
        }}
      >
        {strings.noCommentsTitle}
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
        {strings.noCommentsSubtitle}
      </Text>
    </View>
  );
}

export default NoCommentsPlaceHolder;
