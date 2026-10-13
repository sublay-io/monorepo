import React from "react";
import { type UITheme, uiColor } from "./theme";

function Skeleton({
  style,
  theme = "light",
}: React.HTMLAttributes<HTMLDivElement> & { theme?: UITheme }) {
  return (
    <>
      <style>
        {`
      @keyframes sublay-pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    `}
      </style>
      <div
        style={{
          animation: "sublay-pulse 1.5s ease-in-out infinite",
          width: "100%",
          height: 16,
          borderRadius: 8,
          backgroundColor: uiColor("skeleton", theme),
          ...style,
        }}
      />
    </>
  );
}

// The layout values mirror a real comment row, so the skeleton sits where the
// content will appear. Pass the values of the component it stands in for.
function CommentSkeleton({
  avatarSize = 32,
  gap = 12,
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
    <div
      style={{
        display: "flex",
        gap,
        width: "100%",
        boxSizing: "border-box",
        paddingInlineStart: paddingLeft + extraLeftPadding,
      }}
    >
      <Skeleton
        theme={theme}
        style={{
          height: avatarSize,
          width: avatarSize,
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "grid", gap: lineGap, flex: 1, alignContent: "start" }}>
        <Skeleton theme={theme} style={{ width: "30%", height: 12 }} />
        <Skeleton theme={theme} style={{ height: 12 }} />
        <Skeleton theme={theme} style={{ width: "15%", height: 12 }} />
      </div>
    </div>
  );
}

function UserMentionSkeleton({ theme = "light" }: { theme?: UITheme }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        width: "100%",
        alignItems: "center",
      }}
    >
      <Skeleton
        theme={theme}
        style={{ height: "35px", width: "35px", borderRadius: "100%" }}
      />
      <div style={{ flex: 1 }}>
        <Skeleton theme={theme} />
      </div>
    </div>
  );
}

export { CommentSkeleton, UserMentionSkeleton, Skeleton };
