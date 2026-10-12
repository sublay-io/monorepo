import { View } from "react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../hooks/use-ui-state";
import {
  AVATAR_GAP,
  AVATAR_SIZE,
  AVATAR_TOP,
} from "./comment-thread/single-comment/indentation-threading-lines";

function FetchingCommentsSkeletons() {
  const { theme } = useUIState();
  return (
    // Sized and spaced like the comment rows they stand in for
    <View className="gap-[38px] pb-6" style={{ paddingTop: AVATAR_TOP }}>
      {[1, 2, 3].map((i) => (
        <CommentSkeleton
          theme={theme}
          avatarSize={AVATAR_SIZE}
          gap={AVATAR_GAP}
          lineGap={18}
          paddingLeft={0}
          key={i}
        />
      ))}
    </View>
  );
}

export default FetchingCommentsSkeletons;
