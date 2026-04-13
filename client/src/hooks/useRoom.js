import { useState, useEffect, useRef, useCallback } from 'react';
import SFUClient from '../utils/sfuClient';

export function useRoom() {
  const clientRef = useRef(null);

  const [phase, setPhase] = useState('lobby'); // lobby | connecting | room
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Media state
  const [localStream, setLocalStream] = useState(null);
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // Peers: Map<socketId, { displayName, streams: { audio?, video? } }>
  const [peers, setPeers] = useState(new Map());
  // Consumer tracks: Map<socketId, { audio?: MediaStreamTrack, video?: MediaStreamTrack }>
  const peerTracksRef = useRef(new Map());

  // Chat
  const [messages, setMessages] = useState([]);

  const addPeerTrack = useCallback((socketId, kind, track) => {
    const current = peerTracksRef.current.get(socketId) || {};
    current[kind] = track;
    peerTracksRef.current.set(socketId, current);

    setPeers((prev) => {
      const next = new Map(prev);
      const peer = next.get(socketId) || { displayName: socketId, tracks: {} };
      peer.tracks = { ...peer.tracks, [kind]: track };
      next.set(socketId, peer);
      return next;
    });
  }, []);

  const removePeerTrack = useCallback((socketId, kind) => {
    const current = peerTracksRef.current.get(socketId) || {};
    delete current[kind];
    peerTracksRef.current.set(socketId, current);

    setPeers((prev) => {
      const next = new Map(prev);
      const peer = next.get(socketId);
      if (peer) {
        const tracks = { ...peer.tracks };
        delete tracks[kind];
        peer.tracks = tracks;
        next.set(socketId, peer);
      }
      return next;
    });
  }, []);

  const joinRoom = useCallback(async (name, room) => {
    setConnecting(true);
    setError('');

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setLocalStream(stream);

      const client = new SFUClient();
      clientRef.current = client;
      client.connect();

      // Wait for socket connection
      await new Promise((res, rej) => {
        client.socket.once('connect', res);
        client.socket.once('connect_error', rej);
        setTimeout(() => rej(new Error('Connection timeout')), 8000);
      });

      // Register callbacks before joining
      client.onPeerJoined = ({ socketId, displayName: dn }) => {
        setPeers((prev) => {
          const next = new Map(prev);
          next.set(socketId, { displayName: dn, tracks: {} });
          return next;
        });
        setMessages((prev) => [...prev, {
          id: Date.now(),
          type: 'system',
          message: `${dn} joined`,
          timestamp: Date.now(),
        }]);
      };

      client.onPeerLeft = ({ socketId, displayName: dn }) => {
        setPeers((prev) => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
        peerTracksRef.current.delete(socketId);
        setMessages((prev) => [...prev, {
          id: Date.now(),
          type: 'system',
          message: `${dn} left`,
          timestamp: Date.now(),
        }]);
      };

      client.onChatMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
      };

      client.onNewConsumer = ({ consumer, producerSocketId, kind }) => {
        addPeerTrack(producerSocketId, kind, consumer.track);
      };

      client.onConsumerClosed = (consumerId) => {
        // Find which consumer this was
        for (const [, consumer] of client.consumers.entries()) {
          if (consumer.id === consumerId) break;
        }
      };

      client.onNewProducer = ({ producerSocketId, displayName: dn }) => {
        setPeers((prev) => {
          const next = new Map(prev);
          if (!next.has(producerSocketId)) {
            next.set(producerSocketId, { displayName: dn || producerSocketId, tracks: {} });
          }
          return next;
        });
      };

      // Join room & load device
      const existingPeers = await client.joinRoom(room, name);

      // Set existing peers in state
      setPeers((prev) => {
        const next = new Map(prev);
        for (const peer of existingPeers) {
          next.set(peer.socketId, { displayName: peer.displayName, tracks: {} });
        }
        return next;
      });

      // Produce local tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) await client.produce(videoTrack);
      if (audioTrack) await client.produce(audioTrack);

      setDisplayName(name);
      setRoomId(room);
      setPhase('room');
    } catch (err) {
      console.error('Join error:', err);
      setError(err.message || 'Failed to join room');
      clientRef.current?.disconnect();
      clientRef.current = null;
    } finally {
      setConnecting(false);
    }
  }, [addPeerTrack]);

  const toggleCamera = useCallback(async () => {
    const client = clientRef.current;
    const stream = localStream;
    if (!stream || !client) return;

    const newState = !camEnabled;
    setCamEnabled(newState);
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = newState;

    if (newState) {
      await client.resumeProducer('video');
    } else {
      await client.pauseProducer('video');
    }
  }, [camEnabled, localStream]);

  const toggleMic = useCallback(async () => {
    const client = clientRef.current;
    const stream = localStream;
    if (!stream || !client) return;

    const newState = !micEnabled;
    setMicEnabled(newState);
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = newState;

    if (newState) {
      await client.resumeProducer('audio');
    } else {
      await client.pauseProducer('audio');
    }
  }, [micEnabled, localStream]);

  const sendMessage = useCallback((message) => {
    clientRef.current?.sendChatMessage(message);
  }, []);

  const leaveRoom = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    clientRef.current?.disconnect();
    clientRef.current = null;
    setLocalStream(null);
    setPeers(new Map());
    peerTracksRef.current.clear();
    setMessages([]);
    setCamEnabled(true);
    setMicEnabled(true);
    setPhase('lobby');
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    phase, error, connecting,
    roomId, displayName,
    localStream, camEnabled, micEnabled,
    peers,
    messages,
    joinRoom, leaveRoom,
    toggleCamera, toggleMic,
    sendMessage,
    socketId: clientRef.current?.socket?.id,
  };
}
