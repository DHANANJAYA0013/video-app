import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg2);
  border-left: 1px solid var(--border);
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const Title = styled.h3`
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Count = styled.span`
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 100px;
  font-size: 10px;
  padding: 2px 7px;
  font-family: var(--font-mono);
`;

const CloseBtn = styled.button`
  background: none;
  color: var(--text3);
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  &:hover { color: var(--text); background: var(--surface2); }
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageItem = styled.div`
  animation: ${slideIn} 0.2s ease both;
`;

const SystemMsg = styled.div`
  text-align: center;
  font-size: 11px;
  color: var(--text3);
  padding: 4px 0;
  font-style: italic;
`;

const ChatBubble = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  gap: 3px;
`;

const BubbleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--text3);
  ${props => props.$isOwn ? 'flex-direction: row-reverse;' : ''}
`;

const BubbleName = styled.span`
  color: ${props => props.$isOwn ? 'var(--accent2)' : 'var(--text2)'};
  font-weight: 700;
`;

const BubbleTime = styled.span``;

const Bubble = styled.div`
  max-width: 85%;
  padding: 8px 12px;
  border-radius: ${props => props.$isOwn ? '12px 4px 12px 12px' : '4px 12px 12px 12px'};
  background: ${props => props.$isOwn ? 'var(--accent-dim)' : 'var(--surface)'};
  border: 1px solid ${props => props.$isOwn ? 'rgba(0, 229, 255, 0.2)' : 'var(--border)'};
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
`;

const InputArea = styled.div`
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const ChatInput = styled.input`
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 13px;
  padding: 10px 14px;
  transition: border-color 0.2s;

  &:focus { border-color: var(--accent2); }
  &::placeholder { color: var(--text3); }
`;

const SendBtn = styled.button`
  background: var(--accent);
  color: var(--bg);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #1af0ff;
    transform: translateY(-1px);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text3);
  font-size: 12px;
`;

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ messages, onSend, currentSocketId, onClose }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatMessages = messages.filter(m => m.type !== 'system' || true);

  return (
    <Panel>
      <Header>
        <Title>
          💬 Chat
          <Count>{messages.filter(m => !m.type).length}</Count>
        </Title>
        {onClose && <CloseBtn onClick={onClose}>✕</CloseBtn>}
      </Header>

      <Messages>
        {chatMessages.length === 0 && (
          <EmptyState>
            <span style={{ fontSize: '24px' }}>💭</span>
            <span>No messages yet. Say hi!</span>
          </EmptyState>
        )}
        {chatMessages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <MessageItem key={msg.id}>
                <SystemMsg>— {msg.message} —</SystemMsg>
              </MessageItem>
            );
          }
          const isOwn = msg.senderId === currentSocketId;
          return (
            <MessageItem key={msg.id}>
              <ChatBubble $isOwn={isOwn}>
                <BubbleHeader $isOwn={isOwn}>
                  <BubbleName $isOwn={isOwn}>{isOwn ? 'You' : msg.senderName}</BubbleName>
                  <BubbleTime>{formatTime(msg.timestamp)}</BubbleTime>
                </BubbleHeader>
                <Bubble $isOwn={isOwn}>{msg.message}</Bubble>
              </ChatBubble>
            </MessageItem>
          );
        })}
        <div ref={bottomRef} />
      </Messages>

      <InputArea>
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          maxLength={500}
        />
        <SendBtn onClick={handleSend} disabled={!input.trim()}>
          →
        </SendBtn>
      </InputArea>
    </Panel>
  );
}
