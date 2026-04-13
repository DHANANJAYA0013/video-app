import React from 'react';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg2);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  position: relative;
`;

const CtrlBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: var(--radius);
  background: ${props => props.$active ? 'var(--surface2)' : 'var(--danger-dim)'};
  border: 1px solid ${props => props.$active ? 'var(--border2)' : 'rgba(255,71,87,0.25)'};
  color: ${props => props.$active ? 'var(--text)' : 'var(--danger)'};
  font-size: 20px;
  transition: all 0.18s;
  min-width: 60px;

  &:hover {
    background: ${props => props.$active ? 'var(--border)' : 'rgba(255,71,87,0.25)'};
    transform: translateY(-1px);
  }

  .label {
    font-size: 10px;
    letter-spacing: 0.5px;
    font-family: var(--font-mono);
    color: var(--text3);
  }
`;

const ChatBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: var(--radius);
  background: ${props => props.$active ? 'var(--accent-dim)' : 'var(--surface2)'};
  border: 1px solid ${props => props.$active ? 'rgba(0, 229, 255, 0.3)' : 'var(--border2)'};
  color: ${props => props.$active ? 'var(--accent)' : 'var(--text2)'};
  font-size: 20px;
  transition: all 0.18s;
  min-width: 60px;
  position: relative;

  &:hover {
    background: var(--border);
    transform: translateY(-1px);
  }

  .label {
    font-size: 10px;
    letter-spacing: 0.5px;
    font-family: var(--font-mono);
    color: var(--text3);
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--danger);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
`;

const LeaveBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 24px;
  border-radius: var(--radius);
  background: var(--danger);
  color: white;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.18s;
  margin-left: 24px;

  &:hover {
    background: #ff2336;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
  }

  .label {
    font-size: 10px;
    letter-spacing: 0.5px;
    font-family: var(--font-mono);
    color: rgba(255,255,255,0.7);
  }
`;

const RoomInfo = styled.div`
  position: absolute;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RoomId = styled.div`
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text2);

  span { color: var(--accent); }
`;

const PeerCount = styled.div`
  font-size: 11px;
  color: var(--text3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 2px 8px;
`;

const Separator = styled.div`
  width: 1px;
  height: 40px;
  background: var(--border);
  margin: 0 4px;
`;

export default function ControlBar({
  camEnabled, micEnabled,
  onToggleCam, onToggleMic,
  onLeave,
  showChat, onToggleChat,
  unreadCount,
  roomId, peerCount,
}) {
  return (
    <Bar>
      <RoomInfo>
        <RoomId>Room: <span>{roomId}</span></RoomId>
        <PeerCount>{peerCount} participant{peerCount !== 1 ? 's' : ''}</PeerCount>
      </RoomInfo>

      <CtrlBtn $active={micEnabled} onClick={onToggleMic}>
        {micEnabled ? '🎤' : '🔇'}
        <span className="label">{micEnabled ? 'Mute' : 'Unmute'}</span>
      </CtrlBtn>

      <CtrlBtn $active={camEnabled} onClick={onToggleCam}>
        {camEnabled ? '📹' : '📷'}
        <span className="label">{camEnabled ? 'Cam Off' : 'Cam On'}</span>
      </CtrlBtn>

      <Separator />

      <ChatBtn $active={showChat} onClick={onToggleChat}>
        💬
        <span className="label">Chat</span>
        {unreadCount > 0 && !showChat && <UnreadBadge>{unreadCount > 9 ? '9+' : unreadCount}</UnreadBadge>}
      </ChatBtn>

      <LeaveBtn onClick={onLeave}>
        📵
        <span className="label">Leave</span>
      </LeaveBtn>
    </Bar>
  );
}
