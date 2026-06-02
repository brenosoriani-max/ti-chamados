"use client";

import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Monitor, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RemoteAccessControlProps {
  hostname: string | null;
  ipAddress: string | null;
  ticketId?: string | null;
  equipmentId?: string | null;
}

export function RemoteAccessControl({
  hostname,
  ipAddress,
  ticketId,    // ✅ agora desestruturado
  equipmentId, // ✅ agora desestruturado
}: RemoteAccessControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shadowId, setShadowId] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const target = hostname || ipAddress || "localhost";
  const command = `mstsc /shadow:${shadowId || "1"} /v:${target} /noConsentPrompt /control`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setPopupStyle(null);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX;

    setPopupStyle({ position: "absolute", top: `${top}px`, left: `${left}px`, zIndex: 9999, width: 256 });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadSessions() {
      try {
        if (ticketId) {
          const res = await fetch(`/api/tickets/${ticketId}/remote-access`);
          if (res.ok) {
            const data = await res.json();
            setSessions(data.remoteSessions || []);
            return;
          }
        }

        if (equipmentId) {
          const res = await fetch(`/api/remote-sessions`);
          if (res.ok) {
            const all = await res.json();
            setSessions(all.filter((s: any) => s.equipmentId === equipmentId));
          }
        }
      } catch (err) {
        console.error("Failed to load remote sessions", err);
      }
    }

    loadSessions();
  }, [isOpen, ticketId, equipmentId]); 
  // ... resto do JSX sem alterações
}