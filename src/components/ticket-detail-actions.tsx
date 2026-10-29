"use client";

import { useState } from "react";
import { CheckCircle2, SendToBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketFinishDialog, TicketTransferDialog } from "@/components/ticket-action-modals";
import { TicketStatus } from "@/types";

type TechOption = {
  id: string;
  name: string;
};

export function TicketDetailActions({
  ticketId,
  ticketStatus,
  techList,
  canManage,
}: {
  ticketId: string;
  ticketStatus: TicketStatus;
  techList: TechOption[];
  canManage: boolean;
}) {
  const [finishOpen, setFinishOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  if (!canManage || [TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO].includes(ticketStatus)) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-2 rounded-xl"
          onClick={() => setFinishOpen(true)}
        >
          <CheckCircle2 className="h-4 w-4" />
          Finalizar atendimento
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
          onClick={() => setTransferOpen(true)}
        >
          <SendToBack className="h-4 w-4" />
          Transferir
        </Button>
      </div>

      <TicketFinishDialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        ticketId={ticketId}
      />

      <TicketTransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        ticketId={ticketId}
        techList={techList}
      />
    </>
  );
}
