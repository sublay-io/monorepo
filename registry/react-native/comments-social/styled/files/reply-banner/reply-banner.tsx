import { View, Text, TouchableOpacity } from "react-native";
import { useCommentSection, getUserName } from "@sublay/react-native";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

const ReplyBanner = () => {
  const {
    repliedToComment,
    showReplyBanner,
    setShowReplyBanner,
    pushMention,
    setRepliedToComment,
  } = useCommentSection();
  const { theme } = useUIState();

  let repliedToUser = "";
  if (pushMention) {
    repliedToUser = getUserName(pushMention);
  } else if (repliedToComment?.user) {
    repliedToUser = getUserName(repliedToComment.user);
  }

  if (!showReplyBanner) return null;
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        overflow: "hidden",
        // 🎨 CUSTOMIZATION: Reply banner background
        backgroundColor: theme === 'dark' ? "#404040" : "#e7e7e7",
        padding: 10.5,
        height: "auto",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{
          // 🎨 CUSTOMIZATION: Reply banner text color
          color: theme === 'dark' ? "#A3A3A3" : "#787878",
          fontSize: 12.25,
          lineHeight: 17.5,
        }}>
          {strings.replyingTo(repliedToUser)}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setRepliedToComment?.(null);
            setShowReplyBanner?.({ newState: false });
          }}
          hitSlop={8}
          // 🎨 CUSTOMIZATION: Close button spacing from the screen's edge
          style={{ paddingHorizontal: 7 }}
        >
          <Text style={{
            fontSize: 17.5,
            lineHeight: 24.5,
            // 🎨 CUSTOMIZATION: Close button color
            color: theme === 'dark' ? "#FAFAFA" : "#000"
          }}>&times;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReplyBanner;
