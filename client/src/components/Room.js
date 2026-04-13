import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import VideoTile from './VideoTile';
import PeerVideoTile from './PeerVideoTile';
import ChatPanel from './ChatPanel';
import ControlBar from './ControlBar';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
`;

const Logo = styled.div`
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.5px;

  span { color: var(--accent); }
`;

const StatusDot = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--success);
  background: var(--success-dim);
  border: 1px solid rgba(46, 213, 115, 0.2);
  border-radius: 100px;
  padding: 4px 10px;

  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--success);
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
`;

const VideoArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-width: 0;
`;

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: ${props => {
    const n = props.$count;
    if (n === 1) return '1fr';
    if (n === 2) return 'repeat(2, 1fr)';
    if (n <= 4) return 'repeat(2, 1fr)';
    if (n <= 9) return 'repeat(3, 1fr)';
    if (n <= 16) return 'repeat(4, 1fr)';
    return 'repeat(5, 1fr)';
  }};
  align-content: start;
`;

const ChatSidebar = styled.div`
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const EmptyRoom = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text3);
  font-size: 13px;
  text-align: center;

  .icon { font-size: 40px; }
  .title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--text2);
  }
`;

export default function Room({
  localStream, camEnabled, micEnabled,
  peers, messages,
  onToggleCam, onToggleMic,
  onLeave, onSendMessage,
  roomId, displayName, socketId,
}) {
  const [showChat, setShowChat] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);
  const chatMessages = messages.filter(m => !m.type);
  const unreadCount = chatMessages.length - lastReadCount;

  const handleToggleChat = () => {
    setShowChat(prev => {
      if (!prev) setLastReadCount(chatMessages.length);
      return !prev;
    });
  };

  useEffect(() => {
    if (showChat) setLastReadCount(chatMessages.length);
  }, [messages, showChat]);

  const allParticipants = peers.size + 1; // +1 for local

  return (
    <Layout>
      <Header>
        <Logo>Nex<span>Stream</span></Logo>
        <StatusDot>Connected · {displayName}</StatusDot>
      </Header>

      <Main>
        <VideoArea>
          {peers.size === 0 ? (
            <EmptyRoom>
              <div className="icon">👥</div>
              <div className="title">Waiting for others…</div>
              <div>Share the room ID <strong style={{ color: 'var(--accent)' }}>{roomId}</strong> to invite participants</div>
              <Grid $count={1} style={{ width: '100%', maxWidth: '480px', margin: '16px auto 0' }}>
                <VideoTile
                  stream={localStream}
                  displayName={displayName}
                  isLocal
                  camEnabled={camEnabled}
                  micEnabled={micEnabled}
                />
              </Grid>
            </EmptyRoom>
          ) : (
            <Grid $count={allParticipants}>
              <VideoTile
                stream={localStream}
                displayName={displayName}
                isLocal
                camEnabled={camEnabled}
                micEnabled={micEnabled}
              />
              {[...peers.entries()].map(([socketId, peer]) => (
                <PeerVideoTile key={socketId} peer={peer} />
              ))}
            </Grid>
          )}
        </VideoArea>

        {showChat && (
          <ChatSidebar>
            <ChatPanel
              messages={messages}
              onSend={onSendMessage}
              currentSocketId={socketId}
              onClose={() => setShowChat(false)}
            />
          </ChatSidebar>
        )}
      </Main>

      <ControlBar
        camEnabled={camEnabled}
        micEnabled={micEnabled}
        onToggleCam={onToggleCam}
        onToggleMic={onToggleMic}
        onLeave={onLeave}
        showChat={showChat}
        onToggleChat={handleToggleChat}
        unreadCount={unreadCount}
        roomId={roomId}
        peerCount={allParticipants}
      />
    </Layout>
  );
}
