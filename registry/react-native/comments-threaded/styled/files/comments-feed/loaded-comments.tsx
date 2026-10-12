import { View } from "react-native";
import { Comment as CommentType } from "@sublay/react-native";
import CommentThread from "./comment-thread";

function LoadedComments({ data }: { data: CommentType[] }) {
  return (
    <View
      style={{
        // 🎨 CUSTOMIZATION: Space between top-level threads (Default: 8)
        gap: 8,
      }}
    >
      {data?.map((c) => (
        <CommentThread comment={c} depth={0} key={c.id} />
      ))}
    </View>
  );
}

export default LoadedComments;
