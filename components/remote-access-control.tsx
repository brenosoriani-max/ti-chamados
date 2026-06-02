"use client";

import { useState } from "react";
import { Monitor, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RemoteAccessControlProps {
  hostname: string | null;
  ipAddress: string | null;
}

export function RemoteAccessControl({ hostname, ipAddress }: RemoteAccessControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shadowId, setShadowId] = useState("");
  const [copied, setCopied] = useState(false);
  
  const target = hostname || ipAddress || "localhost";
  const command = `mstsc /shadow:${shadowId || "1"} /v:${target} /noConsentPrompt /control`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
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
      >
        {isOpen ? <X className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
      </Button>

      {isOpen && (
        <div 
          className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-card border border-border shadow-2xl rounded-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acesso Remoto</h4>
              <p className="text-[9px] text-muted-foreground/60 leading-tight">Insira o ID da sessão ativa no host para gerar o comando.</p>
            </div>
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
      )}
    </div>
  );
}
