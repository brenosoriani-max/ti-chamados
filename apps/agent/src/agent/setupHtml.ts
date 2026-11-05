export const SETUP_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Configurações - TI Chamados Agent</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --bg-strong: #eef4ff;
      --panel: rgba(255, 255, 255, 0.88);
      --panel-2: rgba(255, 255, 255, 0.76);
      --border: rgba(148, 163, 184, 0.24);
      --text: #0f172a;
      --muted: #52607a;
      --primary: #2563eb;
      --primary-strong: #1d4ed8;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --shadow: rgba(37, 99, 235, 0.14);
      --soft: rgba(148, 163, 184, 0.06);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b1020;
        --bg-strong: #0f172a;
        --panel: rgba(15, 23, 42, 0.88);
        --panel-2: rgba(15, 23, 42, 0.76);
        --border: rgba(148, 163, 184, 0.22);
        --text: #e2e8f0;
        --muted: #94a3b8;
        --primary: #38bdf8;
        --primary-strong: #0ea5e9;
        --success: #34d399;
        --warning: #fbbf24;
        --error: #f87171;
        --shadow: rgba(14, 165, 233, 0.25);
        --soft: rgba(148, 163, 184, 0.04);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    html, body {
      width: 100%;
      height: 100%;
    }

    body {
      background:
        radial-gradient(circle at top, rgba(37, 99, 235, 0.12), transparent 30%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg-strong) 100%);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 28px;
    }

    .container {
      position: relative;
      width: 100%;
      max-width: 840px;
      min-height: 640px;
      background: rgba(255, 255, 255, 0.42);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 24px;
      padding: 24px 26px 20px;
      box-shadow: 0 22px 58px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(37, 99, 235, 0.04);
      backdrop-filter: blur(16px);
    }

    @media (prefers-color-scheme: dark) {
      .container {
        background: rgba(15, 23, 42, 0.82);
        box-shadow: 0 22px 58px rgba(15, 23, 42, 0.62), 0 0 0 1px rgba(56, 189, 248, 0.12);
      }
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 22px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .brand-mark {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-badge {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--primary), var(--primary-strong));
      display: grid;
      place-items: center;
      font-weight: 800;
      color: #eff6ff;
      box-shadow: 0 12px 28px var(--shadow);
      letter-spacing: -0.05em;
    }

    .brand h1 {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .brand small {
      display: block;
      color: var(--muted);
      font-size: 11px;
      margin-top: 2px;
    }

    .pill {
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.16);
      color: var(--primary);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 9px;
      border-radius: 999px;
    }

    .status-card {
      display: grid;
      grid-template-columns: 12px 1fr;
      gap: 12px;
      align-items: center;
      background: var(--soft);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 13px 15px;
      margin-bottom: 18px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--muted);
      box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.08);
      justify-self: center;
      transition: all 0.2s ease;
    }

    .status-dot.online {
      background: var(--success);
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12), 0 0 12px rgba(16, 185, 129, 0.6);
      animation: pulse 2s infinite;
    }

    .status-dot.connecting {
      background: var(--warning);
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12), 0 0 12px rgba(245, 158, 11, 0.6);
      animation: pulse 1.4s infinite;
    }

    .status-dot.error {
      background: var(--error);
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12), 0 0 12px rgba(239, 68, 68, 0.5);
    }

    .status-label {
      display: block;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 4px;
    }

    .status-val {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 22px;
      align-items: start;
      height: calc(100% - 120px);
    }

    .panel {
      background: rgba(255, 255, 255, 0.28);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 18px 18px 14px;
    }

    @media (prefers-color-scheme: dark) {
      .panel {
        background: rgba(15, 23, 42, 0.42);
      }
    }

    .panel-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: 0.01em;
    }

    .form-group input {
      width: 100%;
      background: rgba(148, 163, 184, 0.04);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 11px 12px;
      color: var(--text);
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .form-group input:focus {
      border-color: rgba(37, 99, 235, 0.7);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
      background: rgba(255, 255, 255, 0.62);
    }

    @media (prefers-color-scheme: dark) {
      .form-group input:focus {
        background: rgba(15, 23, 42, 0.72);
      }
    }

    .hint {
      font-size: 10px;
      color: var(--muted);
      line-height: 1.5;
    }

    .token-box {
      display: none;
      margin-top: 4px;
      background: rgba(148, 163, 184, 0.04);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px 10px;
    }

    .token-box span {
      display: block;
      font-size: 10px;
      color: var(--muted);
      margin-bottom: 6px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .token-badge {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.12);
      color: var(--primary);
      border-radius: 999px;
      padding: 5px 9px;
      font-size: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      cursor: pointer;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }

    .btn {
      flex: 1;
      border: none;
      border-radius: 12px;
      padding: 12px 14px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.75;
      cursor: wait;
      transform: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-strong));
      color: #eff6ff;
      box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
      flex: 0.72;
    }

    .side-info {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .mini-card {
      background: rgba(148, 163, 184, 0.04);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
    }

    .mini-card h3 {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .mini-card p {
      font-size: 13px;
      color: var(--text);
      line-height: 1.6;
    }

    .mini-card ul {
      list-style: none;
      display: grid;
      gap: 8px;
      margin-top: 8px;
    }

    .mini-card li {
      color: var(--muted);
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mini-card li::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
    }

    @keyframes pulse {
      0% { opacity: 0.75; }
      50% { opacity: 1; }
      100% { opacity: 0.75; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <div class="brand-mark">
        <div class="brand-badge">T</div>
        <div>
          <h1>TI Chamados</h1>
          <small>Agente remoto</small>
        </div>
      </div>
      <div class="pill">online</div>
    </div>

    <div class="status-card">
      <div id="statusDot" class="status-dot"></div>
      <div>
        <span class="status-label">Status da conexão</span>
        <span id="statusText" class="status-val">Carregando...</span>
      </div>
    </div>

    <div class="content">
      <div class="panel">
        <div class="panel-title">Configuração do agente</div>
        <form id="settingsForm">
          <div class="form-group">
            <label for="serverUrl">URL do servidor</label>
            <input type="url" id="serverUrl" placeholder="Ex: http://192.168.1.10:3000" required>
            <div class="hint">Endereço IP ou domínio do painel Next.js.</div>
          </div>

          <div class="form-group">
            <label for="terminalName">Nome do terminal</label>
            <input type="text" id="terminalName" placeholder="Ex: Financeiro - PC 02">
            <div class="hint">Nome amigável para identificação no suporte.</div>
          </div>

          <div class="form-group">
            <label for="token">Token do terminal</label>
            <input type="text" id="token" placeholder="Deixe em branco para auto-registro">
            <div class="hint">Token único, quando já existe no painel.</div>
            <div id="tokenContainer" class="token-box">
              <span>Token ativo</span>
              <div id="activeToken" class="token-badge">Nenhum</div>
            </div>
          </div>

          <div class="actions">
            <button type="submit" id="saveBtn" class="btn btn-primary">Salvar & Conectar</button>
            <button type="button" id="hideBtn" class="btn btn-secondary" style="display: none;">Ocultar</button>
          </div>
        </form>
      </div>

      <div class="side-info">
        <div class="mini-card">
          <h3>Resumo</h3>
          <p>Configure a conexão do agente com o servidor central do TI Chamados para registrar este computador e permitir suporte remoto.</p>
        </div>

        <div class="mini-card">
          <h3>Recomendações</h3>
          <ul>
            <li>Use um IP local estável</li>
            <li>Evite URLs com espaços</li>
            <li>Mantenha o token sempre salvo</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <script>
    const serverUrlInput = document.getElementById("serverUrl");
    const terminalNameInput = document.getElementById("terminalName");
    const tokenInput = document.getElementById("token");
    const saveBtn = document.getElementById("saveBtn");
    const hideBtn = document.getElementById("hideBtn");
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    const tokenContainer = document.getElementById("tokenContainer");
    const activeTokenBadge = document.getElementById("activeToken");

    function updateStatusUI(status, errorMsg, token) {
      statusDot.className = "status-dot";

      if (status === "Online") {
        statusDot.className = "status-dot online";
        statusText.textContent = "Conectado (ONLINE)";
        statusText.style.color = "var(--success)";
        hideBtn.style.display = "block";
      } else if (status.startsWith("Conectando") || status === "Criando sessao" || status === "Aguardando agente") {
        statusDot.className = "status-dot connecting";
        statusText.textContent = status;
        statusText.style.color = "var(--warning)";
      } else if (status === "Erro de Conexão" || errorMsg) {
        statusDot.className = "status-dot error";
        statusText.textContent = errorMsg || "Erro na conexão";
        statusText.style.color = "var(--error)";
      } else {
        statusDot.className = "status-dot";
        statusText.textContent = status || "Desconectado";
        statusText.style.color = "var(--muted)";
      }

      if (token) {
        tokenContainer.style.display = "block";
        activeTokenBadge.textContent = token;
      } else {
        tokenContainer.style.display = "none";
      }
    }

    activeTokenBadge.addEventListener("click", async () => {
      const value = activeTokenBadge.textContent;
      if (!value || value === "Nenhum") return;

      try {
        await navigator.clipboard.writeText(value);
        const originalText = activeTokenBadge.textContent;
        activeTokenBadge.textContent = "Copiado!";
        setTimeout(() => {
          activeTokenBadge.textContent = originalText;
        }, 1000);
      } catch {
        activeTokenBadge.textContent = "Falha ao copiar";
      }
    });

    window.tiAgent.getSettings().then((settings) => {
      serverUrlInput.value = settings.serverUrl || "";
      terminalNameInput.value = settings.terminalName || "";
      tokenInput.value = settings.token || "";
      updateStatusUI(settings.status, settings.error, settings.token);
    });

    window.tiAgent.onStatusUpdated((event) => {
      updateStatusUI(event.status, event.error, event.token);

      const isSettled = event.status === "Online" || event.status === "Erro de Conexão";

      if (isSettled) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Salvar & Conectar";
      }
    });

    document.getElementById("settingsForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = "Conectando...";

      const payload = {
        serverUrl: serverUrlInput.value.trim(),
        terminalName: terminalNameInput.value.trim(),
        token: tokenInput.value.trim()
      };

      await window.tiAgent.saveSettings(payload);
    });

    hideBtn.addEventListener("click", () => {
      window.tiAgent.hideWindow();
    });
  </script>
</body>
</html>
`;
