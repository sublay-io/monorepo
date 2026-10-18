import React from "react";
import { I18nManager } from "react-native";
import Svg, { Path } from "react-native-svg";

interface SendIconProps {
  size?: number;
  color?: string;
}

// A paper plane pointing toward the end of the line: right, or left in
// right-to-left layouts.
const SendIcon: React.FC<SendIconProps> = ({ size = 16, color = "#FFFFFF" }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
  >
    <Path d="M3 3.5 21.5 12 6.6 11.3Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={0.8} />
    <Path d="M3 20.5 21.5 12 6.6 12.7Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={0.8} />
  </Svg>
);

export default SendIcon;
