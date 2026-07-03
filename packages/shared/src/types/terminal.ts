export type TerminalRegisterPayload = {
  equipmentUuid: string;
  token?: string;
  hostname: string;
  machineName: string;
  sistemaOperacional: string;
  windowsVersion?: string;
  arquitetura: string;
  memoriaRamGb: number;
  processador: string;
  usuarioLogado: string;
  ip: string;
  versaoAgente: string;
  resolucaoTela: string;
  quantidadeMonitores: number;
  empresaId?: string;
};

export type TerminalHeartbeatPayload = {
  token: string;
  ip?: string;
  usuarioLogado?: string;
};

export type TerminalRegisteredPayload = {
  terminalId: string;
  token: string;
  identificador: string;
};

export type TerminalUpdatedPayload = {
  id: string;
  status: "ONLINE" | "OFFLINE";
  ultimaConexao?: string;
  ip?: string;
  usuarioLogado?: string;
  versaoAgente?: string;
  sistemaOperacional?: string;
  hostname?: string;
  memoriaRamGb?: number;
  processador?: string;
  quantidadeMonitores?: number;
};
