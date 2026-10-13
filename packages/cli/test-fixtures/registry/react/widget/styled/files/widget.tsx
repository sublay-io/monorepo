import { UserAvatar } from "~shared/react/user-avatar";
import { Row } from "./parts/row/row";
import { useWidget } from "../hooks/use-widget";
import { format } from "../utils/format";

export interface WidgetProps {
  title: string;
}

export default function Widget({ title }: WidgetProps) {
  const count: number = useWidget();
  return (
    <div>
      <UserAvatar size={24} />
      <Row label={format(title, count)} />
    </div>
  );
}
