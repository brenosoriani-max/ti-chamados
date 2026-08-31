require("reflect-metadata");
require("tsx/cjs");

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const serverHost = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const { setupRemoteSocket } = require("./server/socket/setup.ts");
  setupRemoteSocket(io);

  io.on("connection", (socket) => {
    socket.on("join-ticket", (ticketId) => {
      if (!socket.data?.user && !socket.role) return;
      socket.join(`ticket-${ticketId}`);
    });

    socket.on("leave-ticket", (ticketId) => {
      if (!socket.data?.user && !socket.role) return;
      socket.leave(`ticket-${ticketId}`);
    });

    socket.on("send-message", (data) => {
      if ((!socket.data?.user && !socket.role) || !data?.ticketId) return;
      socket.to(`ticket-${data.ticketId}`).emit("receive-message", data);
    });

    socket.on("join-user", (userId) => {
      if (!socket.data?.user) return;
      const u = socket.data.user;
      if (u.id === String(userId) || u.role === "ADMIN" || u.role === "TECNICO") {
        socket.join(`user-${userId}`);
      }
    });

    socket.on("send-notification", (data) => {
      if (!socket.data?.user || !data?.userId) return;
      const u = socket.data.user;
      if (u.role === "ADMIN" || u.role === "TECNICO" || u.id === String(data.userId)) {
        socket.to(`user-${data.userId}`).emit("receive-notification", data);
      }
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, serverHost, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Ready on http://${serverHost}:${port}`);
    console.log(`> Accepting connections on your local IP (e.g. 10.0.0.53)`);
  });
});
