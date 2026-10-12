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
    <View
      style={{
        // Sized and spaced like the comment rows they stand in for
        gap: 38,
        paddingTop: AVATAR_TOP,
        paddingBottom: 24,
      }}
    >
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
