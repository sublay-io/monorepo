import { View, Image, PixelRatio, StyleSheet } from "react-native";
import Svg, { Circle, Polygon, Rect } from "react-native-svg";
import {
  getUserAvatar,
  USER_AVATAR_VIEW_BOX_SIZE,
  type UserAvatarShape,
} from "./get-user-avatar";
import { type AvatarFile, pickAvatarSource } from "./pick-avatar-source";
import { type UITheme, uiColors } from "./theme";

interface UserProps {
  id?: string;
  avatar?: string | null | undefined;
  avatarFile?: AvatarFile | null | undefined; // Avatar uploaded through Sublay
  name?: string | null | undefined;
  username?: string | null | undefined;
}

const renderShape = (shape: UserAvatarShape, index: number) => {
  switch (shape.type) {
    case "circle":
      return (
        <Circle
          key={index}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={shape.fill}
          fillOpacity={shape.fillOpacity}
        />
      );
    case "rect":
      return (
        <Rect
          key={index}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          fill={shape.fill}
          fillOpacity={shape.fillOpacity}
        />
      );
    case "polygon":
      return (
        <Polygon
          key={index}
          points={shape.points.map(([x, y]) => `${x},${y}`).join(" ")}
          fill={shape.fill}
          fillOpacity={shape.fillOpacity}
        />
      );
  }
};

// The default avatar for a user without an avatar image, generated on the
// device from the user's id (see get-user-avatar.ts). It fills its parent.
const GeneratedAvatar = ({ id }: { id: string | undefined }) => {
  const { background, shapes } = getUserAvatar(id);

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${USER_AVATAR_VIEW_BOX_SIZE} ${USER_AVATAR_VIEW_BOX_SIZE}`}
    >
      <Rect
        width={USER_AVATAR_VIEW_BOX_SIZE}
        height={USER_AVATAR_VIEW_BOX_SIZE}
        fill={background}
      />
      {shapes.map(renderShape)}
    </Svg>
  );
};

const UserAvatar = ({
  user,
  size = 32,
  borderRadius,
  theme = "light",
}: {
  user: UserProps | null | undefined;
  size?: number | undefined;
  borderRadius?: number | undefined;
  theme?: UITheme; // colors to draw with (default: light)
}) => {
  if (!user) return null;

  // The uploaded avatar file, then the `avatar` URL, then a generated avatar
  const source = pickAvatarSource(user, size, PixelRatio.get());

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: borderRadius || size / 2,
          borderColor: uiColors[theme].divider,
        },
      ]}
    >
      {source ? (
        <Image
          source={{
            uri: source,
          }}
          style={[
            styles.image,
            {
              borderRadius: borderRadius || size / 2,
            },
          ]}
        />
      ) : (
        <GeneratedAvatar id={user.id} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    overflow: "hidden",
    borderWidth: 1,
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});

export default UserAvatar;
