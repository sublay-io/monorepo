import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { type UITheme, uiColors } from "./theme";

function Skeleton({
  style,
  theme = "light",
}: {
  style?: any;
  theme?: UITheme;
}) {
  // Mirrors the react-js sibling's CSS `pulse 1.5s ease-in-out infinite`
  // (opacity 1 -> 0.3 -> 1). A bare `new Animated.Value(...)` in the style
  // prop is inert — nothing drives it — so the "pulse" used to be a static
  // opacity that also allocated a fresh Animated.Value on every render.
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      // Without this the loop keeps running against an unmounted view.
      animation.stop();
      opacity.setValue(1);
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { backgroundColor: uiColors[theme].skeleton },
        style,
        { opacity },
      ]}
    />
  );
}

// The layout values mirror a real comment row, so the skeleton sits where the
// content will appear. Pass the values of the component it stands in for.
function CommentSkeleton({
  avatarSize = 32,
  gap = 8,
  lineGap = 8,
  paddingLeft = 16,
  extraLeftPadding = 0,
  theme = "light",
}: {
  avatarSize?: number; // Avatar diameter
  gap?: number; // Space between the avatar and the text lines
  lineGap?: number; // Space between the text lines
  paddingLeft?: number; // Space before the avatar
  extraLeftPadding?: number; // Added to paddingLeft (for nested rows)
  theme?: UITheme;
}) {
  return (
    <View
      style={[
        styles.commentContainer,
        { gap, paddingStart: paddingLeft + extraLeftPadding },
      ]}
    >
      <Skeleton
        theme={theme}
        style={{
          height: avatarSize,
          width: avatarSize,
          borderRadius: avatarSize / 2,
        }}
      />
      <View style={[styles.textSkeletonContainer, { gap: lineGap }]}>
        <Skeleton
          theme={theme}
          style={{ ...styles.textSkeleton, width: "30%" }}
        />
        <Skeleton theme={theme} style={styles.textSkeleton} />
        <Skeleton
          theme={theme}
          style={{ ...styles.textSkeleton, width: "15%" }}
        />
      </View>
    </View>
  );
}

// Laid out like a mention-suggestion row. Pass the values of the row it
// stands in for.
function UserMentionSkeleton({
  avatarSize = 32,
  gap = 8,
  paddingVertical = 8,
  paddingHorizontal = 0,
  theme = "light",
}: {
  avatarSize?: number; // Avatar diameter
  gap?: number; // Space between the avatar and the text line
  paddingVertical?: number; // Row padding above and below
  paddingHorizontal?: number; // Row padding left and right
  theme?: UITheme;
}) {
  return (
    <View
      style={[
        styles.mentionContainer,
        { gap, paddingVertical, paddingHorizontal },
      ]}
    >
      <Skeleton
        theme={theme}
        style={{
          height: avatarSize,
          width: avatarSize,
          borderRadius: avatarSize / 2,
        }}
      />
      <View style={{ flex: 1 }}>
        <Skeleton
          theme={theme}
          style={{ ...styles.textSkeleton, width: "40%" }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 8,
    width: "100%",
    height: 16,
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  textSkeletonContainer: {
    flex: 1,
    // The name line of a comment row starts just below the top of the avatar
    marginTop: 2,
  },
  textSkeleton: {
    width: "100%",
    height: 12,
    borderRadius: 6,
  },
  mentionContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
  },
});

export { CommentSkeleton, UserMentionSkeleton, Skeleton };
