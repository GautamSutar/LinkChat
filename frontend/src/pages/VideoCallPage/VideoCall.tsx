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

  // --- THE FIX: Add a ref to prevent negotiation race conditions ("glare") ---
  const isNegotiating = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    const accessToken = TokenService.getAccessToken();
    const socketUrl = `${config.WS_URL}/ws/video/${sessionId}/?token=${accessToken}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = async () => {
      setStatus("Waiting for partner...");
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
          if (isNegotiating.current) break;
          isNegotiating.current = true;
          setStatus("Partner connected. Creating offer...");
          createAndSendOffer();
          break;
        case "video_offer":
          if (isNegotiating.current) break;
          isNegotiating.current = true;
          setStatus("Offer received. Creating answer...");
          handleOffer(data.sdp);
          break;
        case "video_answer":
          setStatus("Answer received. Connecting...");
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
      isNegotiating.current = false;
      localStream.current?.getTracks().forEach((track) => track.stop());
      peerConnection.current?.close();
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [sessionId]);

  const createPeerConnection = (): RTCPeerConnection => {
    if (peerConnection.current) {
      return peerConnection.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    localStream.current?.getTracks().forEach((track) => {
      if (localStream.current) {
        pc.addTrack(track, localStream.current);
      }
    });
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Connected!");
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({ type: "ice_candidate", candidate: event.candidate })
        );
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const createAndSendOffer = async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "video_offer", sdp: offer }));
    }
  };

  const handleOffer = async (sdp: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "video_answer", sdp: answer }));
    }
  };

  const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnection.current && candidate) {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  };

  return (
    <div className="flex flex-col h-screen  text-white p-4">
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
