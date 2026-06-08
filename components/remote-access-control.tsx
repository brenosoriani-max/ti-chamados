"use client";

import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Monitor, Copy, Check, X, Download, Terminal, ExternalLink } from "lucide-react";
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
  ticketId,
  equipmentId,
}: RemoteAccessControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shadowId, setShadowId] = useState("1");
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const target = hostname || ipAddress || "localhost";
  const shadowCommand = `mstsc /shadow:${shadowId} /v:${target} /noConsentPrompt /control`;
  const directLink = `ms-rdp://full%20address=s:${target}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shadowCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadRdpFile = () => {
    const content = `full address:s:${target}\nprompt for credentials:i:1\nscreen mode id:i:2`;
    const blob = new Blob([content], { type: "application/x-rdp" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${target}.rdp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBatFile = () => {
    const content = `@echo off\n${shadowCommand}\npause`;
    const blob = new Blob([content], { type: "application/x-bat" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `connect-shadow-${target}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    setPopupStyle({ position: "absolute", top: `${top}px`, left: `${left}px`, zIndex: 9999, width: 280 });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadSessions() {
      try {
        let endpoint = "";
        if (ticketId) {
          endpoint = `/api/tickets/${ticketId}/remote-access`;
        } else if (equipmentId) {
          endpoint = `/api/remote-sessions?equipmentId=${equipmentId}`;
        } else {
          return;
        }

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const remoteSessions = data.remoteSessions || data;
          setSessions(Array.isArray(remoteSessions) ? remoteSessions : []);
          if (remoteSessions.length > 0 && remoteSessions[0].sessionId) {
            setShadowId(String(remoteSessions[0].sessionId));
          }
        }
      } catch (err) {
        console.error("Failed to load remote sessions", err);
      }
    }

    loadSessions();
  }, [isOpen, ticketId, equipmentId]);

  if (!mounted) return null;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 rounded-lg transition-all",
          isOpen ? "bg-primary/20 text-primary" : "hover:bg-primary/10 hover:text-primary"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Monitor className="h-3.5 w-3.5" />
      </Button>

      {isOpen && ReactDOM.createPortal(
        <div 
          style={popupStyle!} 
          className="bg-card border border-border/40 shadow-2xl rounded-2xl p-4 space-y-4 animate-in fade-in zoom-in duration-200"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Acesso Remoto</h4>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-muted/20 rounded-xl border border-border/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Sessão Completa</p>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded font-bold">RECOMENDADO</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-[10px] h-8 font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700" asChild>
                  <a href={directLink}>
                    <ExternalLink className="h-3 w-3 mr-2" />
                    CONECTAR AGORA
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={downloadRdpFile} title="Baixar arquivo .rdp">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[8px] text-muted-foreground mt-2 italic">* Abre o aplicativo de Área de Trabalho Remota nativo.</p>
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-primary uppercase">Espelhamento (Shadow)</p>
                <div className="flex items-center gap-1 bg-background/50 px-1.5 py-0.5 rounded border border-primary/20">
                  <span className="text-[8px] font-bold text-primary">ID:</span>
                  <input 
                    type="text" 
                    value={shadowId} 
                    onChange={(e) => setShadowId(e.target.value)}
                    className="bg-transparent border-none outline-none text-[9px] w-4 font-bold text-primary"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "w-full text-[9px] h-8 font-bold rounded-lg border-primary/20 hover:bg-primary/10 transition-all",
                    copied ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" : "text-primary"
                  )} 
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                  {copied ? "COMANDO COPIADO!" : "COPIAR COMANDO SHADOW"}
                </Button>
                <p className="text-[8px] text-center text-muted-foreground">Cole no <kbd className="px-1 py-0.5 bg-muted rounded text-[7px] font-bold italic">Win + R</kbd> e aperte Enter</p>
              </div>
            </div>

            <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10">
              <p className="text-[10px] font-bold text-sky-600 uppercase mb-2">Assistência Rápida</p>
              <Button size="sm" variant="outline" className="w-full text-[10px] h-8 font-bold rounded-lg border-sky-500/20 text-sky-600 hover:bg-sky-500/10" asChild>
                <a href="quickassist:">
                  <Monitor className="h-3 w-3 mr-2" />
                  ABRIR QUICK ASSIST
                </a>
              </Button>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="pt-2 border-t border-border/20">
              <p className="text-[8px] font-bold text-muted-foreground mb-2 uppercase">Sessões Ativas</p>
              <div className="space-y-1">
                {sessions.map((s: any) => (
                  <button 
                    key={s.id} 
                    onClick={() => setShadowId(String(s.sessionId))}
                    className="w-full text-left p-1.5 rounded bg-muted/10 hover:bg-muted/20 border border-transparent hover:border-primary/20 transition-all flex items-center justify-between"
                  >
                    <span className="text-[9px] font-medium truncate">{s.userName || "Usuário"}</span>
                    <span className="text-[9px] font-bold text-primary">ID: {s.sessionId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}