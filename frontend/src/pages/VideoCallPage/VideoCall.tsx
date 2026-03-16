import React, { useEffect, useRef, useState, useCallback } from "react";
import config from "../../config";
import TokenService from "../../service/token.service";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

type VideoCallProps = {
  sessionId: string;
  isVideo?: boolean;
  onLeaveVideo: () => void;
};

const VideoCall: React.FC<VideoCallProps> = ({ sessionId, isVideo = true, onLeaveVideo }) => {
  const [status, setStatus] = useState("Getting camera/mic...");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const isNegotiating = useRef(false);
  const iceCandidateBuffer = useRef<RTCIceCandidate[]>([]);
  const ringtone = useRef<HTMLAudioElement | null>(null);

  // Assign remote stream to video/audio element after it's set
  useEffect(() => {
    if (!remoteStream) return;
    if (isVideo && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (!isVideo && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideo]);

  useEffect(() => {
    ringtone.current = new Audio("/sounds/slack_ringtone.mp3");
    ringtone.current.loop = true;

    let socket: WebSocket;

    const startCall = async () => {
      // 1. Get media FIRST — so tracks are ready before any signaling
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo,
          audio: true,
        });
        localStream.current = stream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = stream;
        }
        console.log("Media acquired. Tracks:", stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      } catch (err) {
        console.error("Media error:", err);
        setStatus("Camera/Mic access denied.");
        return;
      }

      // 2. Play ringtone while connecting
      ringtone.current?.play().catch(() => {});
      setStatus("Connecting...");

      // 3. Open WebSocket AFTER stream is ready
      const accessToken = TokenService.getAccessToken();
      const socketUrl = `${config.WS_URL}/ws/video/${sessionId}/?token=${accessToken}`;
      socket = new WebSocket(socketUrl);
      ws.current = socket;

      socket.onopen = () => {
        setStatus("Waiting for partner...");
        console.log("Video WS opened, session:", sessionId);
      };

      socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log("VideoCall WS:", data.type);

        switch (data.type) {
          case "partner_ready":
            if (!isNegotiating.current) {
              isNegotiating.current = true;
              setStatus("Partner joined! Connecting...");
              ringtone.current?.pause();
              createAndSendOffer();
            }
            break;
          case "video_offer":
            if (!isNegotiating.current) {
              isNegotiating.current = true;
              ringtone.current?.pause();
              handleOffer(data.sdp);
            }
            break;
          case "video_answer":
            handleAnswer(data.sdp);
            break;
          case "ice_candidate":
            handleIceCandidate(data.candidate);
            break;
          case "call_ended":
            ringtone.current?.pause();
            onLeaveVideo();
            break;
        }
      };

      socket.onclose = () => {
        ringtone.current?.pause();
        setStatus("Disconnected.");
      };
      socket.onerror = (e) => {
        console.error("VideoCall WS error:", e);
        setStatus("Connection error.");
      };
    };

    startCall();

    return () => {
      ringtone.current?.pause();
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "call_ended" }));
        ws.current.close();
      }
      isNegotiating.current = false;
      iceCandidateBuffer.current = [];
      localStream.current?.getTracks().forEach((t) => t.stop());
      peerConnection.current?.close();
    };
  }, [sessionId]);

  const createPeerConnection = (): RTCPeerConnection => {
    if (peerConnection.current) return peerConnection.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add ALL tracks (video + audio) from the local stream
    const tracks = localStream.current?.getTracks() ?? [];
    console.log("Adding tracks to PC:", tracks.map(t => `${t.kind}:${t.enabled}`));
    tracks.forEach((track) => {
      if (localStream.current) pc.addTrack(track, localStream.current);
    });

    // Use React state to trigger safe assignment to video ref
    pc.ontrack = (event) => {
      console.log("ontrack:", event.track.kind, "streams:", event.streams.length);
      const stream = event.streams[0];
      if (stream) {
        setRemoteStream(stream);
        setStatus("Connected!");
        ringtone.current?.pause();
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ice_candidate", candidate: event.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("RTCPeerConnection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setStatus("Connected!");
        ringtone.current?.pause();
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setStatus("Partner disconnected.");
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const createAndSendOffer = async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.current?.send(JSON.stringify({ type: "video_offer", sdp: offer }));
  };

  const handleOffer = async (sdp: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const c of iceCandidateBuffer.current) await pc.addIceCandidate(c);
    iceCandidateBuffer.current = [];
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.current?.send(JSON.stringify({ type: "video_answer", sdp: answer }));
  };

  const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const c of iceCandidateBuffer.current) {
      await peerConnection.current.addIceCandidate(c);
    }
    iceCandidateBuffer.current = [];
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const ice = new RTCIceCandidate(candidate);
    if (peerConnection.current?.remoteDescription) {
      await peerConnection.current.addIceCandidate(ice);
    } else {
      iceCandidateBuffer.current.push(ice);
    }
  };

  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    localStream.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOn((prev) => !prev);
  }, []);

  const handleEndCall = () => {
    ringtone.current?.pause();
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "call_ended" }));
    }
    onLeaveVideo();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-white overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-[#111] shrink-0">
        <div>
          <h1 className="text-lg font-bold">{isVideo ? "📹 Video Call" : "🎙 Voice Call"}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{status}</p>
        </div>
        <button
          onClick={handleEndCall}
          className="px-4 py-2 cursor-pointer bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
        >
          End Call
        </button>
      </header>

      {/* Main video area */}
      <main className="relative flex-1 bg-black overflow-hidden">
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <audio ref={remoteAudioRef} autoPlay playsInline />
            <div className="w-28 h-28 rounded-full bg-indigo-700 flex items-center justify-center shadow-xl animate-pulse">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">{status}</p>
          </div>
        )}

        {/* Local PiP */}
        {isVideo && (
          <div className="absolute bottom-20 right-4 w-36 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl bg-black z-10">
            {isVideoOn ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 text-xs">
                Camera Off
              </div>
            )}
            <span className="absolute bottom-1 left-1 text-[10px] text-white/50 font-medium">You</span>
          </div>
        )}

        {/* Waiting overlay */}
        {isVideo && !remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 animate-ping absolute" />
            <div className="w-20 h-20 rounded-full bg-indigo-700/50 flex items-center justify-center relative">
              <svg className="w-9 h-9 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm relative">{status}</p>
          </div>
        )}
      </main>

      {/* Controls */}
      <footer className="flex items-center justify-center gap-5 py-4 bg-[#111] border-t border-white/10 shrink-0">
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow cursor-pointer ${
            isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isMuted ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08C16.39 17.43 19 14.53 19 11h-2z" />
            </svg>
          )}
        </button>

        {isVideo && (
          <button
            onClick={toggleVideo}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow cursor-pointer ${
              !isVideoOn ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isVideoOn ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={handleEndCall}
          title="End Call"
          className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition shadow cursor-pointer"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default VideoCall;
