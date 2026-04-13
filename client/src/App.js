import React from 'react';
import { useRoom } from './hooks/useRoom';
import Lobby from './components/Lobby';
import Room from './components/Room';

export default function App() {
  const {
    phase, error, connecting,
    roomId, displayName,
    localStream, camEnabled, micEnabled,
    peers, messages,
    joinRoom, leaveRoom,
    toggleCamera, toggleMic,
    sendMessage,
    socketId,
  } = useRoom();

  if (phase === 'lobby' || phase === 'connecting') {
    return (
      <Lobby
        onJoin={joinRoom}
        error={error}
        connecting={connecting}
      />
    );
  }

  return (
    <Room
      localStream={localStream}
      camEnabled={camEnabled}
      micEnabled={micEnabled}
      peers={peers}
      messages={messages}
      onToggleCam={toggleCamera}
      onToggleMic={toggleMic}
      onLeave={leaveRoom}
      onSendMessage={sendMessage}
      roomId={roomId}
      displayName={displayName}
      socketId={socketId}
    />
  );
}
