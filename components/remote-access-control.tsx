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

export function RemoteAccessControl({ hostname, ipAddress }: RemoteAccessControlProps) {
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

        // fallback: load sessions by equipment via global endpoint
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

  return (
    <>
      <div className="relative inline-block">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "h-7 w-7 rounded-lg transition-colors",
          isOpen ? "bg-primary text-primary-foreground" : "hover:bg-primary/20 hover:text-primary"
        )}
        ref={buttonRef}
      >
        {isOpen ? <X className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
      </Button>
      </div>

      {mounted && isOpen && popupStyle && ReactDOM.createPortal(
        <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
          <div className="p-4 bg-card border border-border shadow-2xl rounded-2xl" style={{width: 280}}>
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acesso Remoto</h4>
                <p className="text-[9px] text-muted-foreground/60 leading-tight">Insira o ID da sessão ativa no host para gerar o comando.</p>
              </div>

              {sessions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold">Sessões ativas</div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-muted/20"
                        onClick={() => setShadowId(String(s.sessionId))}
                        type="button"
                      >
                        <div className="text-sm font-medium">{s.sessionId} — {s.userName ?? s.requestedBy?.name}</div>
                        <div className="text-xs text-muted-foreground">{s.status}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Nenhuma sessão registrada para este host.</div>
              )}

              <div className="flex gap-2">
                <Input 
                  placeholder="ID (Ex: 1)" 
                  value={shadowId} 
                  onChange={(e) => setShadowId(e.target.value)}
                  className="h-9 text-xs rounded-lg bg-background border-border"
                  autoFocus
                />
                <Button size="icon" onClick={copyToClipboard} className="h-9 w-9 shrink-0 rounded-lg">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg border border-border/20">
                <code className="text-[8px] break-all font-mono opacity-60">
                  {command}
                </code>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
