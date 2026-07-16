export const SETUP_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Configurações - TI Chamados Agent</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      overflow: hidden;
    }

    .container {
      width: 100%;
      max-width: 380px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5);
    }

    .header {
      margin-bottom: 20px;
      text-align: center;
    }

    .header h1 {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .header p {
      font-size: 12px;
      color: var(--muted);
    }

    .status-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--muted);
      flex-shrink: 0;
    }

    .status-dot.online {
      background-color: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: pulse 2s infinite;
    }

    .status-dot.connecting {
      background-color: var(--warning);
      box-shadow: 0 0 8px var(--warning);
      animation: pulse 1.5s infinite;
    }

    .status-dot.error {
      background-color: var(--error);
      box-shadow: 0 0 8px var(--error);
    }

    .status-text-container {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .status-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
      color: var(--muted);
      letter-spacing: 0.05em;
    }

    .status-val {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #fff;
    }

    .form-group input {
      width: 100%;
      background: #09090b;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      color: #fff;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      border-color: var(--primary);
    }

    .form-group p.hint {
      font-size: 10px;
      color: var(--muted);
      margin-top: 4px;
    }

    .btn {
      width: 100%;
      background-color: var(--primary);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
       transition: background-color 0.2s;
      margin-top: 8px;
    }

    .btn:hover {
      background-color: var(--primary-hover);
    }

    .btn:disabled {
      background-color: var(--border);
      color: var(--muted);
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: transparent;
      border: 1px solid var(--border);
      color: #fff;
      margin-top: 10px;
    }

    .btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .token-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 4px;
      cursor: pointer;
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TI Chamados</h1>
      <p>Configuração do Agente Remoto</p>
    </div>

    <div class="status-card">
      <div id="statusDot" class="status-dot"></div>
      <div class="status-text-container">
        <span class="status-label">Status da Conexão</span>
        <span id="statusText" class="status-val">Carregando...</span>
      </div>
    </div>

    <form id="settingsForm">
      <div class="form-group">
        <label for="serverUrl">URL do Servidor *</label>
        <input type="url" id="serverUrl" placeholder="Ex: http://192.168.1.10:3000" required>
        <p class="hint">Endereço IP ou domínio do painel Next.js.</p>
      </div>

      <div class="form-group">
        <label for="terminalName">Nome do Terminal (Opcional)</label>
        <input type="text" id="terminalName" placeholder="Ex: Financeiro - PC 02">
        <p class="hint">Nome amigável para identificar este terminal no suporte.</p>
      </div>

      <div class="form-group">
        <label for="token">Token do Terminal (Opcional)</label>
        <input type="text" id="token" placeholder="Deixe em branco para auto-registro">
        <p class="hint">Token único do terminal se já cadastrado no painel.</p>
        <div id="tokenContainer" style="display: none;">
          <span style="font-size: 10px; color: var(--muted);">Token ativo (clique para copiar):</span><br>
          <div id="activeToken" class="token-badge">Nenhum</div>
        </div>
      </div>

      <button type="submit" id="saveBtn" class="btn">Salvar & Conectar</button>
      <button type="button" id="hideBtn" class="btn btn-secondary" style="display: none;">Rodar em Segundo Plano</button>
    </form>
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

    // copy active token
    activeTokenBadge.addEventListener("click", () => {
      navigator.clipboard.writeText(activeTokenBadge.textContent);
      const originalText = activeTokenBadge.textContent;
      activeTokenBadge.textContent = "Copiado!";
      setTimeout(() => {
        activeTokenBadge.textContent = originalText;
      }, 1000);
    });

    // load initial settings
    window.tiAgent.getSettings().then((settings) => {
      serverUrlInput.value = settings.serverUrl || "";
      terminalNameInput.value = settings.terminalName || "";
      tokenInput.value = settings.token || "";
      updateStatusUI(settings.status, settings.error, settings.token);
    });

    // handle status updates from main process
    window.tiAgent.onStatusUpdated((event) => {
      updateStatusUI(event.status, event.error, event.token);

      const isSettled =
        event.status === "Online" || event.status === "Erro de Conexão";

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
