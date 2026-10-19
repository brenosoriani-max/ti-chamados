import "reflect-metadata";
import "tsx/cjs";

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, type Socket } from "socket.io";

interface TicketSocket extends Socket {
  role?: string;
  data: {
    user?: {
      id?: string;
      role?: string;
    };
  };
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const serverHost = "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const { setupRemoteSocket } = await import("./server/socket/setup");
  setupRemoteSocket(io);

  io.on("connection", (socket: TicketSocket) => {
    socket.on("join-ticket", (ticketId: string) => {
      if (!socket.data?.user && !socket.role) return;
      socket.join(`ticket-${ticketId}`);
      if (socket.data?.user?.role === "ADMIN" || socket.data?.user?.role === "TECNICO") {
        socket.join(`ticket-${ticketId}:staff`);
      }
    });

    socket.on("leave-ticket", (ticketId: string) => {
      if (!socket.data?.user && !socket.role) return;
      socket.leave(`ticket-${ticketId}`);
      socket.leave(`ticket-${ticketId}:staff`);
    });

    socket.on("send-message", (data: { ticketId?: string } & Record<string, unknown>) => {
      if ((!socket.data?.user && !socket.role) || !data?.ticketId) return;
      socket.to(`ticket-${data.ticketId}`).emit("receive-message", data);
    });

    socket.on("join-user", (userId: string) => {
      if (!socket.data?.user) return;
      const user = socket.data.user as { id?: string; role?: string };
      if (user.id === String(userId) || user.role === "ADMIN" || user.role === "TECNICO") {
        socket.join(`user-${userId}`);
      }
    });

    socket.on("send-notification", (data: { userId?: string } & Record<string, unknown>) => {
      if (!socket.data?.user || !data?.userId) return;
      const user = socket.data.user as { id?: string; role?: string };
      if (user.role === "ADMIN" || user.role === "TECNICO" || user.id === String(data.userId)) {
        socket.to(`user-${data.userId}`).emit("receive-notification", data);
      }
    });

    socket.on(
      "ticket:typing",
      (data: { ticketId?: string; userName?: string; isTyping?: boolean } | undefined) => {
        if (!data?.ticketId || !data?.userName) return;
        socket.to(`ticket-${data.ticketId}`).emit("ticket:typing", {
          ticketId: data.ticketId,
          userName: data.userName,
          isTyping: Boolean(data.isTyping),
        });
      }
    );
  });

  httpServer.once("error", (err: Error) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, serverHost, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Ready on http://${serverHost}:${port}`);
    console.log("> Accepting connections on your local IP (e.g. 10.0.0.53)");
  });
});
