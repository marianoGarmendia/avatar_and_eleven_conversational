"use client";
import { useEffect, useRef, useCallback } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";

function Avatar() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const sessionDataRef = useRef<any>(null); // Podés tipar mejor si tenés el tipo

  // useEffect(() => {
  //     initializeAvatarSession();
  // },[initializeAvatarSession])
  // Fetch token
  const fetchAccessToken = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_HEYGEN_API_KEY!;
    const response = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: { "x-api-key": apiKey },
      }
    );

    const { data } = await response.json();
    return data.token;
  }, []);

  const initializeAvatarSession = useCallback(async () => {
    const token = await fetchAccessToken();
    const avatar = new StreamingAvatar({ token });

    avatarRef.current = avatar;

    avatar.on(StreamingEvents.STREAM_READY, (event) => {
      const stream = event.detail;
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    });

    avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    sessionDataRef.current = await avatar.createStartAvatar({
      quality: AvatarQuality.High,
      avatarName: "Katya_CasualLook_public",
      language: "es",
    });

    console.log("Session data:", sessionDataRef.current);
  }, [fetchAccessToken]);

  useEffect(() => {
    initializeAvatarSession();
    return () => {
      // Limpiar en unmount
      terminateAvatarSession();
    };
  }, [initializeAvatarSession]);

  // Handle when avatar stream is ready
  // function handleStreamReady(event) {
  //   if (event.detail && videoElement) {
  //     videoElement.srcObject = event.detail;
  //     videoElement.onloadedmetadata = () => {
  //       videoElement.play().catch(console.error);
  //     };
  //   } else {
  //     console.error("Stream is not available");
  //   }
  // }

  // Handle stream disconnection
  // function handleStreamDisconnected() {
  //   console.log("Stream disconnected");
  //   if (videoElement) {
  //     videoElement.srcObject = null;
  //   }

  //   // Enable start button and disable end button
  //   startButton.disabled = false;
  //   endButton.disabled = true;
  // }

  // End the avatar session
  const terminateAvatarSession = async () => {
    const avatar = avatarRef.current;
    if (!avatar || !sessionDataRef.current) return;

    await avatar.stopAvatar();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    avatarRef.current = null;
  };

  // Handle speaking event
  const handleSpeak = async (text: string) => {
    const avatar = avatarRef.current;
    if (avatar) {
      await avatar.speak({
        text,
        task_type: TaskType.REPEAT,
      });
    }
  };

  return (
    <article className="h-[50%] ">
      <video
        ref={videoRef}
        className="h-[300px] w-full"
        id="avatarVideo"
        autoPlay
        playsInline
      ></video>
    </article>
  );
}

export default Avatar;
