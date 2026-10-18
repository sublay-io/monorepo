import React from "react";
import Svg, { Path } from "react-native-svg";

interface ChevronIconProps {
  direction: "up" | "down";
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const ChevronIcon: React.FC<ChevronIconProps> = ({
  direction,
  size = 16,
  color = "#6B7280",
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d={direction === "up" ? "m4.5 15.75 7.5-7.5 7.5 7.5" : "m19.5 8.25-7.5 7.5-7.5-7.5"}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ChevronIcon;
