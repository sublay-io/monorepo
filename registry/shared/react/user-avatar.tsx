import { resetImg } from "./reset-styles";
import { getUserAvatar } from "./get-user-avatar";
import { type AvatarFile, pickAvatarSource } from "./pick-avatar-source";
import { type UITheme, uiColor } from "./theme";

interface UserProps {
  id?: string;
  avatar?: string | null | undefined;
  avatarFile?: AvatarFile | null | undefined; // Avatar uploaded through Sublay
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

  // The uploaded avatar file, then the `avatar` URL, then a generated avatar.
  // There is no window during server rendering: a pixel ratio of 1 is assumed.
  const pixelRatio =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const source = pickAvatarSource(user, size, pixelRatio);

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
        src={source ?? getUserAvatar(user.id!)}
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
