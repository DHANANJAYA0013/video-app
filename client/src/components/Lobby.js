import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const glitch = keyframes`
  0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 0); }
  20% { clip-path: inset(92% 0 1% 0); transform: translate(1px, 0); }
  40% { clip-path: inset(43% 0 1% 0); transform: translate(-1px, 0); }
  60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, 0); }
  80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, 0); }
  100% { clip-path: inset(58% 0 43% 0); transform: translate(0); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse 60% 40% at 70% 20%, rgba(0, 229, 255, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(0, 153, 187, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    width: 1px; height: 100%;
    background: linear-gradient(to bottom, transparent, rgba(0, 229, 255, 0.08), transparent);
    pointer-events: none;
  }
`;

const GridLines = styled.div`
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 229, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 229, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
`;

const Card = styled.div`
  position: relative;
  width: 420px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 48px 40px;
  animation: ${fadeUp} 0.5s ease both;
  box-shadow: 0 0 0 1px rgba(0,229,255,0.04), var(--shadow);

  &::before {
    content: '';
    position: absolute;
    top: -1px; left: 20%; right: 20%;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--accent), transparent);
  }
`;

const Logo = styled.div`
  margin-bottom: 36px;
  text-align: center;
`;

const LogoText = styled.h1`
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  color: var(--text);
  position: relative;
  display: inline-block;

  span {
    color: var(--accent);
  }
`;

const TagLine = styled.p`
  margin-top: 6px;
  font-size: 11px;
  color: var(--text3);
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const LiveBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--danger-dim);
  border: 1px solid rgba(255, 71, 87, 0.25);
  color: var(--danger);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 100px;
  margin-bottom: 28px;

  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--danger);
    animation: pulse-ring 1.5s ease infinite;
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text3);
`;

const Input = styled.input`
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 14px;
  padding: 12px 16px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: var(--accent2);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  &::placeholder { color: var(--text3); }
`;

const JoinBtn = styled.button`
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  background: var(--accent);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-radius: var(--radius);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
  }

  &:hover:not(:disabled) {
    background: #1af0ff;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.35);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMsg = styled.div`
  padding: 10px 14px;
  background: var(--danger-dim);
  border: 1px solid rgba(255, 71, 87, 0.2);
  border-radius: var(--radius);
  color: var(--danger);
  font-size: 12px;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text3);
  font-size: 11px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const InfoCard = styled.div`
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  text-align: center;

  .val {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: var(--accent);
  }

  .key {
    font-size: 10px;
    color: var(--text3);
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

export default function Lobby({ onJoin, error, connecting }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && room.trim()) {
      onJoin(name.trim(), room.trim().toUpperCase());
    }
  };

  const randomRoom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    setRoom(id);
  };

  return (
    <Wrapper>
      <GridLines />
      <Card>
        <Logo>
          <LogoText>Nex<span>Stream</span></LogoText>
          <TagLine>Scalable SFU Video Conferencing</TagLine>
        </Logo>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LiveBadge>Live Rooms Active</LiveBadge>
        </div>

        <Form as="form" onSubmit={handleSubmit}>
          <Field>
            <Label>Your Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter display name"
              maxLength={32}
              required
            />
          </Field>

          <Field>
            <Label>Room ID</Label>
            <div style={{ position: 'relative' }}>
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                placeholder="e.g. ALPHA7"
                maxLength={12}
                required
                style={{ paddingRight: '90px', letterSpacing: '2px' }}
              />
              <button
                type="button"
                onClick={randomRoom}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent2)',
                  color: 'var(--accent)', borderRadius: '6px', padding: '4px 10px',
                  fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
                }}
              >
                Random
              </button>
            </div>
          </Field>

          {error && <ErrorMsg>⚠ {error}</ErrorMsg>}

          <JoinBtn type="submit" disabled={!name.trim() || !room.trim() || connecting}>
            {connecting ? '[ Connecting... ]' : '[ Join Room ]'}
          </JoinBtn>
        </Form>

        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Divider>Capabilities</Divider>
          <InfoGrid>
            <InfoCard>
              <div className="val">50+</div>
              <div className="key">Users</div>
            </InfoCard>
            <InfoCard>
              <div className="val">SFU</div>
              <div className="key">Arch</div>
            </InfoCard>
            <InfoCard>
              <div className="val">720p</div>
              <div className="key">Video</div>
            </InfoCard>
          </InfoGrid>
        </div>

        <p style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text3)', textAlign: 'center', lineHeight: '1.8' }}>
          Powered by <span style={{ color: 'var(--accent2)' }}>mediasoup</span> SFU ·{' '}
          Camera + microphone access required
        </p>
      </Card>
    </Wrapper>
  );
}
