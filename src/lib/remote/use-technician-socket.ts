"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { remoteSocketEvents } from "@/lib/remote/events";

export function useTechnicianSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function connect() {
      const response = await fetch("/api/auth/socket-token");
      if (!response.ok || !active) return;
      const { token } = await response.json();

      const socket = io({
        auth: { sessionToken: token, role: "technician" },
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socketRef.current = socket;
    }

    connect();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef, connected };
}

export { remoteSocketEvents };
