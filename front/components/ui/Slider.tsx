import { View, Text, type LayoutChangeEvent, Platform } from "react-native";
import { useRef, useState, useCallback, useEffect } from "react";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

interface SliderProps {
  min?: number;
  max?: number;
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  invertColor?: boolean;
}

function getTrackColor(ratio: number, invert?: boolean): string {
  const r = invert ? 1 - ratio : ratio;
  if (r <= 0.33) return "#10B981";
  if (r <= 0.66) return "#F59E0B";
  return "#EF4444";
}

function getValueLabel(value: number, max: number): string {
  const ratio = value / max;
  if (ratio <= 0.2) return "매우 낮음";
  if (ratio <= 0.4) return "낮음";
  if (ratio <= 0.6) return "보통";
  if (ratio <= 0.8) return "높음";
  return "매우 높음";
}

// 웹용 심플 슬라이더 (HTML input range)
function WebSlider({ min = 1, max = 10, value, onValueChange, label, minLabel, maxLabel, invertColor }: SliderProps) {
  const ratio = (value - min) / (max - min);
  const color = getTrackColor(ratio, invertColor);

  return (
    <View className="mb-4">
      {label && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <Text className="text-sm font-bold" style={{ color }}>
            {getValueLabel(value, max)}
          </Text>
        </View>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 8,
          appearance: "none",
          background: `linear-gradient(to right, ${color} ${ratio * 100}%, #E5E7EB ${ratio * 100}%)`,
          borderRadius: 8,
          outline: "none",
          cursor: "pointer",
          accentColor: color,
        }}
      />
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-gray-400">{minLabel || min}</Text>
        <Text className="text-xs text-gray-400">{maxLabel || max}</Text>
      </View>
    </View>
  );
}

// 네이티브용 슬라이더 (Reanimated + Gesture Handler)
function NativeSlider({ min = 1, max = 10, value, onValueChange, label, minLabel, maxLabel, invertColor }: SliderProps) {
  const trackWidth = useRef(0);
  const ratio = (value - min) / (max - min);
  const color = getTrackColor(ratio, invertColor);
  const translateX = useSharedValue(0);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    if (trackWidth.current > 0) {
      translateX.value = ratio * trackWidth.current;
    }
  }, [value, ratio]);

  const updateValue = useCallback(
    (x: number) => {
      const w = trackWidth.current;
      if (w <= 0) return;
      const r = Math.max(0, Math.min(1, x / w));
      const newVal = Math.round(r * (max - min) + min);
      onValueChange(newVal);
    },
    [min, max, onValueChange]
  );

  const gesture = Gesture.Pan()
    .onStart((e) => {
      runOnJS(updateValue)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(updateValue)(e.x);
    })
    .hitSlop({ top: 20, bottom: 20 });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    runOnJS(updateValue)(e.x);
  });

  const composed = Gesture.Race(gesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ratio * trackWidth.current - 12 }],
  }));

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
            {getValueLabel(value, max)}
          </Text>
        </View>
      )}
      <GestureHandlerRootView>
        <GestureDetector gesture={composed}>
          <View className="h-10 justify-center" onLayout={onLayout}>
            <View className="h-2 rounded-full bg-gray-200">
              <View
                className="h-2 rounded-full"
                style={{ width: `${ratio * 100}%`, backgroundColor: color }}
              />
            </View>
            {layoutReady && (
              <Animated.View
                className="absolute w-6 h-6 rounded-full border-2 border-white"
                style={[
                  thumbStyle,
                  {
                    backgroundColor: color,
                    top: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 4,
                  },
                ]}
              />
            )}
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-gray-400">{minLabel || min}</Text>
        <Text className="text-xs text-gray-400">{maxLabel || max}</Text>
      </View>
    </View>
  );
}

export function Slider(props: SliderProps) {
  if (Platform.OS === "web") {
    return <WebSlider {...props} />;
  }
  return <NativeSlider {...props} />;
}
