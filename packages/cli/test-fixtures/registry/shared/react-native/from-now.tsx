import { Text } from "react-native";
import { useUser } from "@sublay/react-native";
import moment from "moment";

export function FromNow({ date }: { date: Date }) {
  useUser();
  return <Text>{moment(date).fromNow()}</Text>;
}
