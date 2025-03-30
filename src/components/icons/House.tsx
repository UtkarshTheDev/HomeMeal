import React from "react";
import Svg, { Path, G, Circle } from "react-native-svg";

interface HouseProps {
  size?: number;
  color?: string;
}

export const House: React.FC<HouseProps> = ({
  size = 80,
  color = "#FF6B00",
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      {/* House shape */}
      <Path
        d="M100 20L20 80V180H70V120H130V180H180V80L100 20Z"
        fill={color}
        fillOpacity={0.8}
        strokeWidth="8"
        stroke={color}
        strokeLinejoin="round"
      />

      {/* Plate circle - representing a meal */}
      <Circle
        cx="100"
        cy="100"
        r="20"
        fill="white"
        fillOpacity={0.9}
        stroke={color}
        strokeWidth="5"
      />

      {/* Fork and knife */}
      <G
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M85 85C85 85 95 75 105 85" />
        <Path d="M115 85C115 85 105 75 95 85" />
        <Path d="M100 85V110" />
      </G>
    </Svg>
  );
};
