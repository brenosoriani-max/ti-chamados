"use client";

import { assignTicketAction } from "@/app/actions";

interface TicketAssignSelectProps {
  ticketId: string;
  assigneeId: string | null;
  techList: { id: string, name: string }[];
  onTransferRequest?: (ticketId: string, toUserId: string) => void;
}

export function TicketAssignSelect({ ticketId, assigneeId, techList, onTransferRequest }: TicketAssignSelectProps) {
  return (
    <select 
      name="assigneeId"
      value={assigneeId ?? ""}
      className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 border-none focus:ring-0 cursor-pointer hover:text-primary transition-colors outline-none"
      onChange={async (e) => {
        const val = e.target.value;
        if (assigneeId && val && val !== assigneeId && onTransferRequest) {
          onTransferRequest(ticketId, val);
          return;
        }
        await assignTicketAction(ticketId, val);
      }}
    >
      <option value="" className="bg-card">Atribuir...</option>
      {techList.map((tech) => (
        <option key={tech.id} value={tech.id} className="bg-card text-foreground">{tech.name}</option>
      ))}
    </select>
  );
}
