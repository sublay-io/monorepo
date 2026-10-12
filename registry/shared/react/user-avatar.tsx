import { resetImg } from "./reset-styles";
import { getUserAvatar } from "./get-user-avatar";
import { type UITheme, uiColor } from "./theme";

interface UserProps {
  id?: string;
  avatar?: string | null | undefined;
  name?: string | null | undefined;
  username?: string | null | undefined;
}

function UserAvatar({
  user,
  size = 32,
  borderRadius,
  theme = "light",
}: {
  user: UserProps | undefined;
  size?: number | undefined;
  borderRadius?: number | undefined;
  theme?: UITheme; // Colors to draw with (default: light)
}) {
  if (!user) return null;
  return (
    <div
      style={{
        overflow: "hidden",
        width: size,
        height: size,
        borderRadius: borderRadius || size,
        // The ring is drawn inside the avatar's size, whatever the host
        // project's CSS reset does
        boxSizing: "border-box",
        border: `1px solid ${uiColor("divider", theme)}`,
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      <img
        src={user.avatar ?? getUserAvatar(user.id!)}
        alt={user.name || user.id}
        style={{
          ...resetImg,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}

export default UserAvatar;
