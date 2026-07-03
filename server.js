require("reflect-metadata");
require("tsx/cjs");

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
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

  const { setupRemoteSocket } = await import("./server/socket/setup.ts");
  setupRemoteSocket(io);

  io.on("connection", (socket) => {
    socket.on("join-ticket", (ticketId) => socket.join(`ticket-${ticketId}`));
    socket.on("leave-ticket", (ticketId) => socket.leave(`ticket-${ticketId}`));
    socket.on("send-message", (data) => socket.to(`ticket-${data.ticketId}`).emit("receive-message", data));
    socket.on("join-user", (userId) => socket.join(`user-${userId}`));
    socket.on("send-notification", (data) => socket.to(`user-${data.userId}`).emit("receive-notification", data));
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
