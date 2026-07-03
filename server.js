require("reflect-metadata");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "10.0.0.53" || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room for specific ticket
    socket.on("join-ticket", (ticketId) => {
      socket.join(`ticket-${ticketId}`);
      console.log(`Socket ${socket.id} joined ticket-${ticketId}`);
    });

    socket.on("leave-ticket", (ticketId) => {
      socket.leave(`ticket-${ticketId}`);
      console.log(`Socket ${socket.id} left ticket-${ticketId}`);
    });

    // Send new message event to others
    socket.on("send-message", (data) => {
      socket.to(`ticket-${data.ticketId}`).emit("receive-message", data);
    });

    // Join room for specific user notifications
    socket.on("join-user", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user-${userId}`);
    });

    // Send notification
    socket.on("send-notification", (data) => {
      socket.to(`user-${data.userId}`).emit("receive-notification", data);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
