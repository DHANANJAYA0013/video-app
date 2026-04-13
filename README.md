# NexStream — Scalable SFU Video Conferencing

A production-ready WebRTC video conferencing app supporting 50+ users per room using **mediasoup** as the SFU (Selective Forwarding Unit) media server.

---

## Architecture

```
┌─────────────┐         ┌──────────────────────────────────┐
│   Browser A │─────────▶                                  │
└─────────────┘  1 send │     mediasoup SFU (Node.js)       │
                         │                                  │
┌─────────────┐  stream │  • Each peer sends ONE stream     │
│   Browser B │─────────▶  • Server forwards to all others │
└─────────────┘         │  • Socket.IO for signaling        │
                         └──────────────────────────────────┘
┌─────────────┐                  │ N-1 receive streams
│   Browser C │◀─────────────────┘
└─────────────┘
```

**Why SFU over Mesh?**
- In a mesh (P2P), each user uploads N-1 streams → breaks at ~4 users
- In SFU, each user uploads exactly 1 stream → scales to 50+ users
- mediasoup handles codec negotiation, transport, and forwarding in native C++

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, styled-components |
| Backend | Node.js, Express, Socket.IO |
| Media Server | mediasoup v3 (SFU) |
| Transport | WebRTC (DTLS/SRTP over UDP/TCP) |
| Signaling | Socket.IO (WebSocket) |

---

## Prerequisites

- **Node.js** v16+ 
- **Python** 3.x (for mediasoup native build)
- **C++ build tools**:
  - **Linux**: `sudo apt install build-essential`
  - **macOS**: `xcode-select --install`
  - **Windows**: Visual Studio Build Tools

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd nexstream

# Install server dependencies (mediasoup will compile native code ~2 min)
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure (Optional)

By default the server uses `127.0.0.1` as the announced IP.  
For LAN/production use, set your machine's IP:

```bash
# server/.env (create this file)
ANNOUNCED_IP=192.168.1.100   # Your LAN IP or public IP
PORT=3001
```

### 3. Run

**Terminal 1 — Server:**
```bash
cd server
npm start
# Or for development with auto-restart:
npm run dev
```

**Terminal 2 — Client:**
```bash
cd client
npm start
# Opens http://localhost:3000
```

### 4. Use

1. Open `http://localhost:3000` in multiple browser tabs/windows
2. Enter a display name and room ID (or click "Random")
3. Grant camera + microphone permissions
4. You're live! Share the room ID with others

---

## Production Deployment

### Server (e.g., Ubuntu VPS)

```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs npm build-essential python3

# Set your server's public IP
export ANNOUNCED_IP=$(curl -s ifconfig.me)

# Run with PM2
npm install -g pm2
cd server && pm2 start index.js --name nexstream-server

# Build client
cd ../client && npm run build
# Serve the build/ folder with nginx or similar
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server HTTP port |
| `ANNOUNCED_IP` | `127.0.0.1` | Public IP for WebRTC ICE candidates |
| `REACT_APP_SERVER_URL` | `http://localhost:3001` | Server URL for the client |

### Firewall Rules

```bash
# Required ports
ufw allow 3001/tcp    # Signaling (Socket.IO)
ufw allow 40000:49999/udp  # mediasoup RTC (UDP preferred)
ufw allow 40000:49999/tcp  # mediasoup RTC (TCP fallback)
```

---

## Project Structure

```
nexstream/
├── server/
│   ├── index.js          # Express + Socket.IO + mediasoup
│   └── package.json
└── client/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── hooks/
        │   └── useRoom.js      # All room state + SFU logic
        ├── utils/
        │   └── sfuClient.js    # mediasoup-client wrapper
        └── components/
            ├── Lobby.js        # Join screen
            ├── Room.js         # Main room layout
            ├── VideoTile.js    # Local video tile
            ├── PeerVideoTile.js # Remote video tile
            ├── ChatPanel.js    # Real-time chat
            └── ControlBar.js   # Mic/cam/chat/leave controls
```

---

## Features

- ✅ **SFU Architecture** — mediasoup, scales to 50+ users
- ✅ **720p Video** — VP8/H264 with adaptive bitrate
- ✅ **Opus Audio** — echo cancellation + noise suppression
- ✅ **Camera on/off** — with visual placeholder
- ✅ **Microphone mute/unmute**
- ✅ **Real-time chat** — with system messages (join/leave)
- ✅ **Adaptive grid layout** — 1→2→3→4→5 column grid
- ✅ **Auto room cleanup** — rooms deleted when empty
- ✅ **Graceful disconnect** — transports & tracks cleaned up

---

## Scaling Beyond Single Server

For thousands of concurrent users, consider:
- **Horizontal scaling**: Multiple mediasoup workers (one per CPU core)
- **Distributed rooms**: Redis pub/sub for cross-server signaling
- **Managed SFU**: LiveKit Cloud, Livekit self-hosted, or Daily.co
- **TURN server**: coturn for users behind strict NAT/firewalls

---

## Troubleshooting

**"Cannot connect to server"**  
→ Make sure the server is running on port 3001 and CORS allows your client origin.

**"mediasoup failed to install"**  
→ Ensure Python 3 and build tools are installed. On macOS: `xcode-select --install`.

**"No video from remote peers"**  
→ Set `ANNOUNCED_IP` to your actual network IP (not `127.0.0.1`) for LAN testing.

**"ICE connection failed"**  
→ Open UDP ports 40000–49999 in your firewall. Add a TURN server for restricted networks.
