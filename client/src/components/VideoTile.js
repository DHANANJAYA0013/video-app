import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Tile = styled.div`
  position: relative;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  aspect-ratio: 16/9;
  border: 1px solid ${props => props.$isLocal ? 'rgba(0, 229, 255, 0.3)' : 'var(--border)'};
  transition: border-color 0.2s;

  &:hover { border-color: var(--border2); }
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  ${props => props.$mirror ? 'transform: scaleX(-1);' : ''}
  ${props => props.$hidden ? 'display: none;' : ''}
`;

const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg2);
  gap: 8px;
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-dim), var(--surface2));
  border: 2px solid var(--accent2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
`;

const NameTag = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(8, 12, 16, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 16px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  .name { overflow: hidden; text-overflow: ellipsis; }
`;

const LocalBadge = styled.span`
  font-size: 9px;
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  padding: 1px 5px;
  letter-spacing: 1px;
  text-transform: uppercase;
  flex-shrink: 0;
`;

const MutedIcon = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 71, 87, 0.9);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
`;

const NoVideoText = styled.p`
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 1px;
`;

export default function VideoTile({ stream, displayName, isLocal, camEnabled = true, micEnabled = true }) {
  const videoRef = useRef(null);
  const hasVideo = stream && (isLocal
    ? stream.getVideoTracks().length > 0
    : !!stream);

  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      videoRef.current.srcObject = stream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const showVideo = hasVideo && (isLocal ? camEnabled : true);
  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Tile $isLocal={isLocal}>
      {!showVideo && (
        <Placeholder>
          <Avatar>{initials}</Avatar>
          <NoVideoText>Camera off</NoVideoText>
        </Placeholder>
      )}
      <Video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        $mirror={isLocal}
        $hidden={!showVideo}
      />
      <NameTag>
        <span className="name">{displayName || 'Unknown'}</span>
        {isLocal && <LocalBadge>You</LocalBadge>}
      </NameTag>
      {isLocal && !micEnabled && <MutedIcon>🔇</MutedIcon>}
    </Tile>
  );
}
