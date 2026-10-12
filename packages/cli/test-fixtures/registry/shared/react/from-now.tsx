import moment from "moment";

export function FromNow({ date }: { date: Date }) {
  return <span>{moment(date).fromNow()}</span>;
}
