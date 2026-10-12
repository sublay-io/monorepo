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
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    `}
      </style>
      <div
        style={{
          animation: "pulse 1.5s ease-in-out infinite",
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

function CommentSkeleton({
  extraLeftPadding = 0,
  theme = "light",
}: {
  extraLeftPadding?: number;
  theme?: UITheme;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        width: "100%",
        paddingLeft: 16 + extraLeftPadding,
      }}
    >
      <Skeleton
        theme={theme}
        style={{ height: 32, width: 32, borderRadius: "50%" }}
      />
      <div style={{ display: "grid", gap: "8px", flex: 1 }}>
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
