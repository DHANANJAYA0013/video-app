import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Tile = styled.div`
  position: relative;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  aspect-ratio: 16/9;
  border: 1px solid var(--border);
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  background: linear-gradient(135deg, rgba(0,153,187,0.15), var(--surface2));
  border: 2px solid var(--border2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--text2);
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
  max-width: calc(100% - 16px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NoVideoText = styled.p`
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 1px;
`;

export default function PeerVideoTile({ peer }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const videoTrack = peer?.tracks?.video;
  const audioTrack = peer?.tracks?.audio;

  useEffect(() => {
    if (!videoRef.current) return;
    if (videoTrack) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [videoTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (audioTrack) {
      const stream = new MediaStream([audioTrack]);
      audioRef.current.srcObject = stream;
    } else {
      audioRef.current.srcObject = null;
    }
  }, [audioTrack]);

  const displayName = peer?.displayName || 'Unknown';
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const hasVideo = !!videoTrack;

  return (
    <Tile>
      {!hasVideo && (
        <Placeholder>
          <Avatar>{initials}</Avatar>
          <NoVideoText>No video</NoVideoText>
        </Placeholder>
      )}
      {hasVideo && (
        <Video ref={videoRef} autoPlay playsInline />
      )}
      <audio ref={audioRef} autoPlay playsInline />
      <NameTag>{displayName}</NameTag>
    </Tile>
  );
}
