import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";

interface WebCameraProps {
  onCapture: (base64: string) => void;
  onError?: (error: string) => void;
}

export function WebCamera({ onCapture, onError }: WebCameraProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");
      }
    } catch (err: unknown) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요."
          : "카메라를 시작할 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.";
      setStatus("error");
      setErrorMessage(message);
      onError?.(message);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

    stopCamera();
    onCapture(base64);
  }, [onCapture, stopCamera]);

  if (Platform.OS !== "web") {
    return null;
  }

  if (status === "error") {
    return (
      <View className="w-64 h-80 rounded-3xl items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
        <Text className="text-3xl mb-3">{"🚫"}</Text>
        <Text className="text-sm text-red-500 text-center px-4 mb-4">
          {errorMessage}
        </Text>
        <TouchableOpacity
          onPress={startCamera}
          className="px-4 py-2 bg-[#6366F1] rounded-full"
        >
          <Text className="text-white text-sm font-medium">재시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="items-center">
      <View
        className="w-64 h-80 rounded-3xl overflow-hidden bg-gray-900"
        style={{ position: "relative" }}
      >
        {status === "loading" && (
          <View className="absolute inset-0 items-center justify-center z-10 bg-gray-900">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-white text-sm mt-2">카메라 준비 중...</Text>
          </View>
        )}

        {/* Video element - web only */}
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
            borderRadius: 24,
          }}
        />

        {/* Hidden canvas for capture */}
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          style={{ display: "none" }}
        />
      </View>

      {/* Capture button */}
      {status === "ready" && (
        <TouchableOpacity
          onPress={handleCapture}
          className="mt-6 w-20 h-20 rounded-full bg-[#6366F1] items-center justify-center"
          style={{
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <View className="w-16 h-16 rounded-full border-4 border-white items-center justify-center">
            <Text className="text-2xl">{"📷"}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
