"use client";

import React, { useEffect, useState, useCallback, useRef, use } from "react";

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";

// ElevenLabs
import { useConversation } from "@11labs/react";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

const VoiceChat = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [message, setMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const sessionDataRef = useRef<any>(null); // Podés tipar mejor si tenés el tipo

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

  // useEffect(() => {
  //   const initAvatar = async () => {
  //     if(!avatarRef.current) return
  //     sessionDataRef.current = await avatarRef.current.createStartAvatar({
  //       quality: AvatarQuality.High,
  //       avatarName: "Katya_CasualLook_public",
  //       language: "es",
  //     });

  //   }
  //   initAvatar()
  // },[avatarRef.current]);

  useEffect(() => {
 
    initializeAvatarSession();
    return () => {
      // Limpiar en unmount
      terminateAvatarSession();
    };
  }, [initializeAvatarSession]);

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

  // useEffect(() => {

  //   if(message) {
  //     handleSpeak(message);
  //   }

  // },[handleSpeak, message])

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
    },
    onMessage: (message) => {
      console.log("Received message:", message);
      console.log("Message content: ", message.message, "de: ", message.source);
      if(message.source === "ai") {
        handleSpeak(message.message);  }
    },
    onError: (error: string | Error) => {
      setErrorMessage(typeof error === "string" ? error : error.message);
      console.error("Error:", error);
    },
    onUnhandledClientToolCall: (toolCall) => {
      console.log("Unhandled client tool call:", toolCall);
    },
    onDebug: (debugInfo) => {
      console.log("Debug info:", debugInfo);
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    // Request microphone permission on component mount
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch (error) {
        setErrorMessage("Microphone access denied");
        console.error("Error accessing microphone:", error);
      }
    };

    requestMicPermission();
  }, []);

  const handleStartConversation = async () => {
    try {
      // Replace with your actual agent ID or URL
      const conversationId = await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
      });
      console.log("Started conversation:", conversationId);
    } catch (error) {
      setErrorMessage("Failed to start conversation");
      console.error("Error starting conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      setErrorMessage("Failed to end conversation");
      console.error("Error ending conversation:", error);
    }
  };

  useEffect(() => {
    conversation.setVolume({ volume: isMuted ? 0 : 1 });

  },[isMuted, conversation])

  // const toggleMute = async () => {
  //   try {
  //     await conversation.setVolume({ volume: isMuted ? 1 : 0 });
  //     setIsMuted(!isMuted);
  //   } catch (error) {
  //     setErrorMessage("Failed to change volume");
  //     console.error("Error changing volume:", error);
  //   }
  // };

  return (
    <Card className="w-full max-w-md mx-auto">
      <article className="h-[50%] ">
        <video
          ref={videoRef}
          className="h-[300px] w-full"
          id="avatarVideo"
          autoPlay
          playsInline
        ></video>
      </article>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {/* Voice Chat */}
          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              disabled={status !== "connected"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button> */}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button
                variant="outline"
                onClick={() => avatarRef.current?.interrupt()}
                
                className="w-full mt-2">
                  Interrurpt
                </Button>
            {status === "connected" ? (
              <Button
                variant="destructive"
                onClick={handleEndConversation}
                className="w-full"
              >
                <MicOff className="mr-2 h-4 w-4" />
                End Conversation
              </Button>
            ) : (
            
              <Button
                onClick={handleStartConversation}
                disabled={!hasPermission}
                className="w-full"
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Conversation
              </Button>
              
              
            )}
          </div>

          <div className="text-center text-sm">
            {status === "connected" && (
              <p className="text-green-600">
                {isSpeaking ? "Agent is speaking..." : "Listening..."}
              </p>
            )}
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            {!hasPermission && (
            
              <p className="text-yellow-600">
                Please allow microphone access to use voice chat
              </p>
              
             
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceChat;
