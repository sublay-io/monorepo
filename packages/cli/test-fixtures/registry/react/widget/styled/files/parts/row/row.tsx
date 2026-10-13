import { FromNow } from '~shared/react/from-now';
import { resetDiv } from "~shared/react/reset-styles";

export function Row({ label }: { label: string }) {
  return (
    <div style={resetDiv}>
      {label} <FromNow date={new Date()} />
    </div>
  );
}
