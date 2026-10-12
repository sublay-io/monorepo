import type { CSSProperties } from "react";
import { getUserAvatar } from "./get-user-avatar";
import { resetDiv } from "./reset-styles";

export interface UserAvatarProps {
  size?: number;
}

export function UserAvatar({ size = 32 }: UserAvatarProps) {
  const style: CSSProperties = { ...resetDiv, width: size, height: size };
  return <img style={style} src={getUserAvatar()} alt="" />;
}
