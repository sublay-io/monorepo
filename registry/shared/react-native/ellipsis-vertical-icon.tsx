import React from "react";
import Svg, { Circle } from "react-native-svg";

interface EllipsisVerticalIconProps {
  size?: number;
  color?: string;
}

// Three dots stacked vertically: the "more options" button.
const EllipsisVerticalIcon: React.FC<EllipsisVerticalIconProps> = ({
  size = 18,
  color = "#9CA3AF",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx={12} cy={5} r={2} />
    <Circle cx={12} cy={12} r={2} />
    <Circle cx={12} cy={19} r={2} />
  </Svg>
);

export default EllipsisVerticalIcon;
