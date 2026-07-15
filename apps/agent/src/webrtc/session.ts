import { app, BrowserWindow, desktopCapturer, ipcMain } from "electron";
import type { Socket } from "socket.io-client";
import { remoteSocketEvents } from "../socket/client";
import path from "path";
import fs from "fs";

let peerWindow: BrowserWindow | null = null;
let currentSocket: Socket | null = null;
let tempHtmlPath: string | null = null;

// Named handlers so we can remove them cleanly on stop
let ipcOfferHandler: ((e: Electron.IpcMainEvent, d: any) => void) | null = null;
let ipcCandidateHandler: ((e: Electron.IpcMainEvent, d: any) => void) | null = null;
let ipcReadyHandler: ((e: Electron.IpcMainEvent) => void) | null = null;

export async function startScreenShare(socket: Socket, payload: { sessaoId: string }) {
  // Clean up any previous session
  if (peerWindow) stopScreenShare();

  currentSocket = socket;

  // --- Step 1: Get screen source ID in the MAIN process ---
  // (avoids the deprecated renderer-side desktopCapturer)
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 0, height: 0 },
  });
  const primarySource = sources[0];
  if (!primarySource) {
    console.error("[agent-webrtc] No screen sources found.");
    return;
  }
  const screenId = primarySource.id;
  console.log("[agent-webrtc] Using screen source:", screenId);

  // --- Step 2: Register ALL IPC handlers BEFORE creating/loading the window ---
  // This eliminates the race condition where the renderer sends 'webrtc:offer'
  // before the main process has registered the handler.

  ipcOfferHandler = (_: Electron.IpcMainEvent, data: { sessaoId: string; offer: RTCSessionDescriptionInit }) => {
    console.log("[agent-webrtc] IPC webrtc:offer received → forwarding to socket");
    socket.emit(remoteSocketEvents.webRtcOffer, data);
  };
  ipcCandidateHandler = (_: Electron.IpcMainEvent, data: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
    socket.emit(remoteSocketEvents.webRtcCandidate, data);
  };

  ipcMain.on("webrtc:offer", ipcOfferHandler);
  ipcMain.on("webrtc:candidate", ipcCandidateHandler);

  // --- Step 3: Forward answer/candidates from socket → renderer ---
  const onAnswer = (data: { sessaoId: string; answer: RTCSessionDescriptionInit }) => {
    console.log("[agent-webrtc] Socket answer received → forwarding to peerWindow");
    if (peerWindow && !peerWindow.isDestroyed()) {
      peerWindow.webContents.send("webrtc:answer", data);
    }
  };
  const onRemoteCandidate = (data: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
    if (peerWindow && !peerWindow.isDestroyed()) {
      peerWindow.webContents.send("webrtc:candidate-remote", data);
    }
  };

  socket.on(remoteSocketEvents.webRtcAnswer, onAnswer);
  socket.on(remoteSocketEvents.webRtcCandidate, onRemoteCandidate);

  // --- Step 4: Create the hidden BrowserWindow ---
  peerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Relay renderer console logs to our terminal for debugging
  peerWindow.webContents.on("console-message", (_ev, level, message, line) => {
    console.log(`[peerWindow] [${level}] ${message} (line ${line})`);
  });

  // --- Step 5: Renderer "ready handshake" ---
  // The renderer sends 'webrtc:renderer-ready' as its FIRST synchronous action.
  // We then send back 'webrtc:start' with screenId — this guarantees no race.
  ipcReadyHandler = (_: Electron.IpcMainEvent) => {
    console.log("[agent-webrtc] peerWindow ready → sending webrtc:start, screenId:", screenId);
    if (peerWindow && !peerWindow.isDestroyed()) {
      peerWindow.webContents.send("webrtc:start", {
        sessaoId: payload.sessaoId,
        screenId,
      });
    }
  };
  ipcMain.once("webrtc:renderer-ready", ipcReadyHandler);

  // --- Step 6: Write runner HTML to a local file (file:// = secure context) ---
  const html = `<!DOCTYPE html>
<html><body><script>
const { ipcRenderer } = require('electron');

// FIRST thing: signal main that renderer is ready (synchronous IPC send)
ipcRenderer.send('webrtc:renderer-ready');

// THEN wait for main to send the screenId via 'webrtc:start'
ipcRenderer.once('webrtc:start', async (_, { sessaoId, screenId }) => {
  console.log('[peerWindow] start signal received. sessaoId=' + sessaoId + ' screenId=' + screenId);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenId,
          maxFrameRate: 30,
        }
      }
    });
    console.log('[peerWindow] getUserMedia OK, tracks=' + stream.getTracks().length);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    let remoteDescriptionSet = false;
    const candidateQueue = [];

    stream.getTracks().forEach(t => {
      pc.addTrack(t, stream);
      console.log('[peerWindow] track added: ' + t.kind + ' / ' + t.label);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ipcRenderer.send('webrtc:candidate', { sessaoId, candidate: e.candidate.toJSON() });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[peerWindow] ICE state: ' + pc.iceConnectionState);
    };
    pc.onconnectionstatechange = () => {
      console.log('[peerWindow] connection state: ' + pc.connectionState);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('[peerWindow] offer created, sending to main');
    ipcRenderer.send('webrtc:offer', { sessaoId, offer });

    ipcRenderer.on('webrtc:answer', async (_, data) => {
      if (data.sessaoId !== sessaoId) return;
      console.log('[peerWindow] answer received, setting remote description');
      try {
        await pc.setRemoteDescription(data.answer);
        remoteDescriptionSet = true;
        for (const c of candidateQueue) {
          await pc.addIceCandidate(c).catch(e => console.error('queued candidate error:', e));
        }
        candidateQueue.length = 0;
      } catch (err) {
        console.error('[peerWindow] setRemoteDescription error:', err.message);
      }
    });

    ipcRenderer.on('webrtc:candidate-remote', async (_, data) => {
      if (data.sessaoId !== sessaoId || !data.candidate) return;
      if (!remoteDescriptionSet) {
        candidateQueue.push(data.candidate);
      } else {
        await pc.addIceCandidate(data.candidate).catch(e => console.error('remote candidate error:', e));
      }
    });

  } catch (err) {
    console.error('[peerWindow] FATAL: ' + err.name + ': ' + err.message);
  }
});
<\/script></body></html>`;

  tempHtmlPath = path.join(app.getPath("userData"), `webrtc_${payload.sessaoId}.html`);
  fs.writeFileSync(tempHtmlPath, html, "utf-8");

  console.log("[agent-webrtc] Loading peerWindow from:", tempHtmlPath);
  await peerWindow.loadFile(tempHtmlPath);
}

export function stopScreenShare() {
  // Remove IPC handlers in reverse-registration order
  if (ipcReadyHandler) {
    ipcMain.off("webrtc:renderer-ready", ipcReadyHandler);
    ipcReadyHandler = null;
  }
  if (ipcOfferHandler) {
    ipcMain.off("webrtc:offer", ipcOfferHandler);
    ipcOfferHandler = null;
  }
  if (ipcCandidateHandler) {
    ipcMain.off("webrtc:candidate", ipcCandidateHandler);
    ipcCandidateHandler = null;
  }

  // Remove socket listeners
  if (currentSocket) {
    currentSocket.off(remoteSocketEvents.webRtcAnswer);
    currentSocket.off(remoteSocketEvents.webRtcCandidate);
    currentSocket = null;
  }

  // Close the peer window
  if (peerWindow) {
    try { peerWindow.close(); } catch { /* already closed */ }
    peerWindow = null;
  }

  // Clean up temp file
  if (tempHtmlPath) {
    try { fs.unlinkSync(tempHtmlPath); } catch { /* ignore */ }
    tempHtmlPath = null;
  }
}
