/** Mensagens amigáveis para o usuário (API, UI, toasts). */

export const messages = {
  auth: {
    invalidLogin: "E-mail ou senha inválidos. Verifique e tente novamente.",
    invalidData: "Preencha e-mail e senha corretamente.",
    unauthenticated: "Sua sessão expirou. Faça login novamente.",
    forbidden: "Você não tem permissão para esta ação.",
    inactiveUser: "Sua conta está inativa. Fale com o administrador.",
    refreshInvalid: "Sessão expirada. Entre novamente para continuar.",
  },
  tickets: {
    listError: "Não foi possível carregar os chamados. Tente novamente.",
    createError: "Não foi possível abrir o chamado. Verifique os dados e tente de novo.",
    invalidData: "Dados do chamado incompletos ou inválidos.",
    notFound: "Chamado não encontrado.",
    getError: "Não foi possível abrir este chamado.",
    updateError: "Não foi possível atualizar o chamado.",
    commentError: "Não foi possível enviar o comentário.",
    commentForbidden: "Comentários internos são apenas para a equipe técnica.",
    invalidComment: "Digite uma mensagem antes de enviar.",
    ratingError: "Não foi possível registrar sua avaliação.",
    invalidRating: "Escolha uma nota de 1 a 5.",
    statusUpdateError: "Não foi possível atualizar o status do chamado.",
    archiveError: "Não foi possível arquivar o chamado.",
    archiveSuccess: "Chamado arquivado.",
    statusUpdated: (status: string) => `Status alterado para: ${status}`,
  },
  users: {
    listError: "Não foi possível carregar os usuários.",
    createError: "Não foi possível cadastrar o usuário.",
    createSuccess: "Usuário cadastrado com sucesso.",
    invalidData: "Dados do usuário inválidos. Confira nome, e-mail e senha.",
    idRequired: "Usuário não informado.",
    notFound: "Usuário não encontrado.",
    deleteError: "Não foi possível remover o usuário.",
    deleteLinked: "Este usuário não pode ser removido porque possui registros vinculados.",
    deactivateError: "Não foi possível desativar o usuário.",
    noPermission: "Sem permissão para gerenciar usuários.",
  },
  terminais: {
    notFound: "Terminal não encontrado.",
    invalidData: "Dados do terminal inválidos.",
    offline: "Este computador está offline. Peça ao usuário para abrir o agente ou fazer login.",
    sessionInvalid: "Não foi possível iniciar a sessão. Tente novamente.",
    sessionNotFound: "Sessão remota não encontrada.",
    sessionForbidden: "Você não pode encerrar esta sessão.",
    deleteSuccess: "Terminal removido com sucesso.",
    deleteError: "Não foi possível remover o terminal.",
    deleteConfirm: "Remover este terminal permanentemente?",
  },
  remote: {
    creating: "Iniciando conexão…",
    waitingAgent: "Aguardando o computador aceitar…",
    connecting: "Conectando…",
    active: "Conectado",
    ended: "Sessão encerrada",
    ready: "Pronto para conectar",
    startFailed: "Não foi possível iniciar o acesso remoto.",
    agentUnavailable: "O agente remoto não está disponível no momento.",
  },
  equipment: {
    invalidData: "Dados do equipamento inválidos.",
  },
  reports: {
    error: "Não foi possível gerar o relatório.",
  },
  generic: {
    unexpected: "Algo deu errado. Tente novamente em instantes.",
    network: "Falha de conexão. Verifique sua internet e tente novamente.",
  },
} as const;

export function sessionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Pronto: messages.remote.ready,
    "Criando sessao": messages.remote.creating,
    "Criando sessão": messages.remote.creating,
    "Aguardando agente": messages.remote.waitingAgent,
    AGUARDANDO: messages.remote.waitingAgent,
    CONECTANDO: messages.remote.connecting,
    ATIVA: messages.remote.active,
    Ativa: messages.remote.active,
    ENCERRADA: messages.remote.ended,
    Encerrada: messages.remote.ended,
  };
  return map[status] ?? status;
}

/** Extrai mensagem amigável de resposta JSON da API. */
export async function readApiError(response: Response, fallback: string = messages.generic.unexpected): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
  } catch {
    /* ignore */
  }
  if (response.status === 401) return messages.auth.unauthenticated;
  if (response.status === 403) return messages.auth.forbidden;
  if (response.status === 404) return messages.generic.unexpected;
  return fallback;
}
