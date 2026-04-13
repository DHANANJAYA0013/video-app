const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mediasoup = require("mediasoup");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ─── Mediasoup Config ──────────────────────────────────────────────────────────
const MEDIA_CODECS = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: { "x-google-start-bitrate": 1000 },
  },
  {
    kind: "video",
    mimeType: "video/H264",
    clockRate: 90000,
    parameters: {
      "packetization-mode": 1,
      "profile-level-id": "4d0032",
      "level-asymmetry-allowed": 1,
    },
  },
];

const WORKER_SETTINGS = {
  logLevel: "warn",
  rtcMinPort: 40000,
  rtcMaxPort: 49999,
};

const WEBRTC_TRANSPORT_OPTIONS = {
  listenIps: [
    {
      ip: "0.0.0.0",
      announcedIp: process.env.ANNOUNCED_IP || "127.0.0.1",
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  initialAvailableOutgoingBitrate: 1000000,
};

// ─── State ─────────────────────────────────────────────────────────────────────
let worker;
// rooms: Map<roomId, { router, peers: Map<socketId, PeerState> }>
const rooms = new Map();

// PeerState shape:
// {
//   socketId, displayName,
//   sendTransport, recvTransport,
//   producers: Map<producerId, producer>,
//   consumers: Map<consumerId, consumer>
// }

// ─── Worker Init ───────────────────────────────────────────────────────────────
async function createWorker() {
  worker = await mediasoup.createWorker(WORKER_SETTINGS);
  worker.on("died", () => {
    console.error("mediasoup worker died, exiting...");
    process.exit(1);
  });
  console.log("mediasoup worker created, pid:", worker.pid);
}

async function getOrCreateRoom(roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  const router = await worker.createRouter({ mediaCodecs: MEDIA_CODECS });
  const room = { router, peers: new Map() };
  rooms.set(roomId, room);
  console.log(`Room ${roomId} created`);
  return room;
}

// ─── HTTP Routes ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/rooms", (req, res) => {
  const info = [];
  for (const [id, room] of rooms.entries()) {
    info.push({ id, peerCount: room.peers.size });
  }
  res.json(info);
});

// ─── Socket.IO Signaling ───────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  let currentRoomId = null;
  let currentPeer = null;

  // ── Join Room ────────────────────────────────────────────────────────────────
  socket.on("joinRoom", async ({ roomId, displayName }, callback) => {
    try {
      const room = await getOrCreateRoom(roomId);
      currentRoomId = roomId;

      currentPeer = {
        socketId: socket.id,
        displayName,
        sendTransport: null,
        recvTransport: null,
        producers: new Map(),
        consumers: new Map(),
      };
      room.peers.set(socket.id, currentPeer);
      socket.join(roomId);

      // Tell existing peers about the newcomer
      socket.to(roomId).emit("peerJoined", {
        socketId: socket.id,
        displayName,
      });

      // Send existing peers list to newcomer
      const existingPeers = [];
      for (const [sid, peer] of room.peers.entries()) {
        if (sid !== socket.id) {
          existingPeers.push({
            socketId: sid,
            displayName: peer.displayName,
            producers: [...peer.producers.keys()],
          });
        }
      }

      callback({
        rtpCapabilities: room.router.rtpCapabilities,
        existingPeers,
      });

      console.log(`${displayName} joined room ${roomId}`);
    } catch (err) {
      console.error("joinRoom error:", err);
      callback({ error: err.message });
    }
  });

  // ── Create WebRTC Transport ──────────────────────────────────────────────────
  socket.on("createTransport", async ({ direction }, callback) => {
    try {
      const room = rooms.get(currentRoomId);
      if (!room) return callback({ error: "Room not found" });

      const transport = await room.router.createWebRtcTransport(
        WEBRTC_TRANSPORT_OPTIONS
      );

      transport.on("dtlsstatechange", (state) => {
        if (state === "closed") transport.close();
      });

      if (direction === "send") {
        currentPeer.sendTransport = transport;
      } else {
        currentPeer.recvTransport = transport;
      }

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      console.error("createTransport error:", err);
      callback({ error: err.message });
    }
  });

  // ── Connect Transport ────────────────────────────────────────────────────────
  socket.on(
    "connectTransport",
    async ({ transportId, dtlsParameters }, callback) => {
      try {
        const room = rooms.get(currentRoomId);
        if (!room) return callback({ error: "Room not found" });

        let transport =
          currentPeer.sendTransport?.id === transportId
            ? currentPeer.sendTransport
            : currentPeer.recvTransport;

        if (!transport) return callback({ error: "Transport not found" });

        await transport.connect({ dtlsParameters });
        callback({ connected: true });
      } catch (err) {
        console.error("connectTransport error:", err);
        callback({ error: err.message });
      }
    }
  );

  // ── Produce (send media) ─────────────────────────────────────────────────────
  socket.on(
    "produce",
    async ({ kind, rtpParameters, appData }, callback) => {
      try {
        const room = rooms.get(currentRoomId);
        if (!room) return callback({ error: "Room not found" });

        const producer = await currentPeer.sendTransport.produce({
          kind,
          rtpParameters,
          appData,
        });

        currentPeer.producers.set(producer.id, producer);

        producer.on("transportclose", () => {
          producer.close();
          currentPeer.producers.delete(producer.id);
        });

        // Notify others in room about new producer
        socket.to(currentRoomId).emit("newProducer", {
          producerId: producer.id,
          producerSocketId: socket.id,
          kind,
          displayName: currentPeer.displayName,
        });

        callback({ producerId: producer.id });
      } catch (err) {
        console.error("produce error:", err);
        callback({ error: err.message });
      }
    }
  );

  // ── Consume (receive media) ──────────────────────────────────────────────────
  socket.on(
    "consume",
    async ({ producerId, rtpCapabilities }, callback) => {
      try {
        const room = rooms.get(currentRoomId);
        if (!room) return callback({ error: "Room not found" });

        if (
          !room.router.canConsume({ producerId, rtpCapabilities })
        ) {
          return callback({ error: "Cannot consume" });
        }

        // Find the producer
        let producer = null;
        let producerPeer = null;
        for (const [, peer] of room.peers.entries()) {
          if (peer.producers.has(producerId)) {
            producer = peer.producers.get(producerId);
            producerPeer = peer;
            break;
          }
        }

        if (!producer) return callback({ error: "Producer not found" });

        const consumer = await currentPeer.recvTransport.consume({
          producerId,
          rtpCapabilities,
          paused: false,
        });

        currentPeer.consumers.set(consumer.id, consumer);

        consumer.on("transportclose", () => {
          consumer.close();
          currentPeer.consumers.delete(consumer.id);
        });

        consumer.on("producerclose", () => {
          consumer.close();
          currentPeer.consumers.delete(consumer.id);
          socket.emit("consumerClosed", { consumerId: consumer.id });
        });

        callback({
          consumerId: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          producerSocketId: producerPeer.socketId,
        });
      } catch (err) {
        console.error("consume error:", err);
        callback({ error: err.message });
      }
    }
  );

  // ── Producer Pause/Resume ────────────────────────────────────────────────────
  socket.on("pauseProducer", async ({ producerId }, callback) => {
    try {
      const producer = currentPeer?.producers.get(producerId);
      if (producer) await producer.pause();
      socket.to(currentRoomId).emit("producerPaused", {
        producerId,
        socketId: socket.id,
      });
      callback?.({ paused: true });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  socket.on("resumeProducer", async ({ producerId }, callback) => {
    try {
      const producer = currentPeer?.producers.get(producerId);
      if (producer) await producer.resume();
      socket.to(currentRoomId).emit("producerResumed", {
        producerId,
        socketId: socket.id,
      });
      callback?.({ resumed: true });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // ── Chat ─────────────────────────────────────────────────────────────────────
  socket.on("chatMessage", ({ roomId, message }) => {
    const msgData = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: currentPeer?.displayName || "Unknown",
      message,
      timestamp: Date.now(),
    };
    io.to(roomId).emit("chatMessage", msgData);
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    if (!currentRoomId || !currentPeer) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    // Close all transports (this closes producers/consumers too)
    currentPeer.sendTransport?.close();
    currentPeer.recvTransport?.close();

    room.peers.delete(socket.id);

    socket.to(currentRoomId).emit("peerLeft", {
      socketId: socket.id,
      displayName: currentPeer.displayName,
    });

    if (room.peers.size === 0) {
      room.router.close();
      rooms.delete(currentRoomId);
      console.log(`Room ${currentRoomId} deleted (empty)`);
    }
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

createWorker().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
