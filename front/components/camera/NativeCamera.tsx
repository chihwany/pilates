import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface NativeCameraProps {
  onCapture: (base64: string) => void;
  onError?: (error: string) => void;
}

export function NativeCamera({ onCapture, onError }: NativeCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // 권한 로딩 중
  if (!permission) {
    return (
      <View className="w-72 h-96 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // 권한 없음
  if (!permission.granted) {
    return (
      <View className="w-72 h-96 bg-gray-100 rounded-3xl items-center justify-center px-6">
        <Text className="text-4xl mb-4">{"📷"}</Text>
        <Text className="text-sm text-gray-700 text-center mb-4">
          컨디션 분석을 위해{"\n"}카메라 권한이 필요합니다
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#6366F1] px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        exif: false,
      });

      if (photo?.base64) {
        onCapture(photo.base64);
      } else {
        onError?.("사진 촬영에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (err) {
      onError?.("카메라 오류가 발생했습니다.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View className="items-center">
      <View className="w-72 h-96 rounded-3xl overflow-hidden mb-6">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          mirror={true}
        />
      </View>

      <TouchableOpacity
        onPress={handleCapture}
        disabled={isCapturing}
        className={`w-20 h-20 rounded-full bg-[#6366F1] items-center justify-center ${isCapturing ? "opacity-50" : ""}`}
        style={{
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {isCapturing ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <View className="w-16 h-16 rounded-full border-4 border-white" />
        )}
      </TouchableOpacity>

      <Text className="text-xs text-gray-400 mt-3">
        {isCapturing ? "촬영 중..." : "촬영 버튼을 눌러주세요"}
      </Text>
    </View>
  );
}
