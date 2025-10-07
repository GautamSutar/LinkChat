import React, { useEffect, useRef, useState } from "react";
import config from "../../config";
import TokenService from "../../service/token.service";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

type VideoCallProps = {
  sessionId: string;
  onLeaveVideo: () => void;
};

const VideoCall: React.FC<VideoCallProps> = ({ sessionId, onLeaveVideo }) => {
  const [status, setStatus] = useState("Initializing...");
  const ws = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!sessionId) return;

    const accessToken = TokenService.getAccessToken();
    const socketUrl = `${config.WS_URL}/ws/video/${sessionId}/?token=${accessToken}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = async () => {
      setStatus("Waiting for partner to connect...");
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
      } catch (error) {
        console.error("Error accessing media devices.", error);
        setStatus("Camera/Mic access denied.");
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "partner_ready":
          setStatus("Partner connected. Preparing video stream...");
          createAndSendOffer();
          break;
        case "video_offer":
          handleOffer(data.sdp);
          break;
        case "video_answer":
          handleAnswer(data.sdp);
          break;
        case "ice_candidate":
          handleIceCandidate(data.candidate);
          break;
      }
    };

    socket.onclose = () => setStatus("Partner disconnected.");
    socket.onerror = () => setStatus("An error occurred.");

    return () => {
      // Cleanup function
      localStream.current?.getTracks().forEach((track) => track.stop());
      peerConnection.current?.close();
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sessionId]);

  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    localStream.current
      ?.getTracks()
      .forEach((track) => pc.addTrack(track, localStream.current!));
    pc.ontrack = (event) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
      setStatus("Connected!");
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current?.send(
          JSON.stringify({ type: "ice_candidate", candidate: event.candidate })
        );
      }
    };
    return pc;
  };

  const createAndSendOffer = async () => {
    peerConnection.current = createPeerConnection();
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    ws.current?.send(JSON.stringify({ type: "video_offer", sdp: offer }));
  };

  const handleOffer = async (sdp: RTCSessionDescriptionInit) => {
    peerConnection.current = createPeerConnection();
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(sdp)
    );
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    ws.current?.send(JSON.stringify({ type: "video_answer", sdp: answer }));
  };

  const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
    await peerConnection.current?.setRemoteDescription(
      new RTCSessionDescription(sdp)
    );
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    await peerConnection.current?.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
        <div>
          <h1 className="text-2xl font-bold">Video Call</h1>
          <p className="text-sm text-gray-400">{status}</p>
        </div>
        <button
          onClick={onLeaveVideo}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
        >
          End Call
        </button>
      </header>
      <main className="relative flex-1 w-full h-full bg-black rounded-lg">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute w-1/4 max-w-[250px] bottom-4 right-4 border-2 border-gray-700 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </main>
    </div>
  );
};

export default VideoCall;
