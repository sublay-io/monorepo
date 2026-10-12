import { useUser } from "@sublay/react-native";
import { FromNow } from "~shared/react-native/from-now";

export default function Widget() {
  useUser();
  return <FromNow date={new Date()} />;
}
