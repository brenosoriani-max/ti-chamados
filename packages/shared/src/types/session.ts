export type SessionCreatePayload = {
  sessaoId: string;
  terminalId: string;
  usuarioId: string;
  usuarioNome: string;
};

export type SessionAcceptPayload = {
  sessaoId: string;
};

export type SessionRejectPayload = {
  sessaoId: string;
  reason?: string;
};

export type SessionEndPayload = {
  sessaoId: string;
  reason?: string;
};

export type SessionStatePayload = {
  sessaoId: string;
  status: "AGUARDANDO" | "CONECTANDO" | "ATIVA" | "ENCERRADA";
  iniciadaEm?: string;
};
