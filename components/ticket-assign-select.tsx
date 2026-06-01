"use client";

import { Select } from "@/components/ui/select";
import { assignTicketAction } from "@/app/actions";

interface TicketAssignSelectProps {
  ticketId: string;
  assigneeId: string | null;
  techList: { id: string, name: string }[];
}

export function TicketAssignSelect({ ticketId, assigneeId, techList }: TicketAssignSelectProps) {
  return (
    <Select 
      name="assigneeId"
      defaultValue={assigneeId ?? ""} 
      className="h-10 text-xs font-bold bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all rounded-xl"
      onChange={async (e) => {
        const val = e.target.value;
        await assignTicketAction(ticketId, val);
      }}
    >
      <option value="">Atribuir técnico...</option>
      {techList.map((tech) => (
        <option key={tech.id} value={tech.id}>{tech.name}</option>
      ))}
    </Select>
  );
}
