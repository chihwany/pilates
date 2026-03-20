import { View, Text, PanResponder, type LayoutChangeEvent } from "react-native";
import { useRef, useState, useCallback } from "react";

interface SliderProps {
  min?: number;
  max?: number;
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
}

function getTrackColor(ratio: number): string {
  if (ratio <= 0.33) return "#10B981";
  if (ratio <= 0.66) return "#F59E0B";
  return "#EF4444";
}

export function Slider({
  min = 1,
  max = 10,
  value,
  onValueChange,
  label,
}: SliderProps) {
  const trackWidth = useRef(0);
  const [layoutReady, setLayoutReady] = useState(false);

  const ratio = (value - min) / (max - min);
  const color = getTrackColor(ratio);

  const clampValue = useCallback(
    (locationX: number) => {
      const r = Math.max(0, Math.min(1, locationX / trackWidth.current));
      const stepped = Math.round(r * (max - min) + min);
      onValueChange(stepped);
    },
    [min, max, onValueChange]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        clampValue(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        clampValue(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
    setLayoutReady(true);
  };

  return (
    <View className="mb-4">
      {label && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <Text className="text-sm font-bold" style={{ color }}>
            {value}
          </Text>
        </View>
      )}
      <View
        className="h-10 justify-center"
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View className="h-2 rounded-full bg-gray-200">
          {/* Filled track */}
          <View
            className="h-2 rounded-full"
            style={{
              width: `${ratio * 100}%`,
              backgroundColor: color,
            }}
          />
        </View>
        {/* Thumb */}
        {layoutReady && (
          <View
            className="absolute w-6 h-6 rounded-full border-2 border-white"
            style={{
              backgroundColor: color,
              left: ratio * trackWidth.current - 12,
              top: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 4,
            }}
          />
        )}
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-gray-400">{min}</Text>
        <Text className="text-xs text-gray-400">{max}</Text>
      </View>
    </View>
  );
}
