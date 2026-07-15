import { app, BrowserWindow, desktopCapturer, ipcMain } from "electron";
import type { Socket } from "socket.io-client";
import { remoteSocketEvents } from "../socket/client";
import path from "path";
import fs from "fs";

let peerWindow: BrowserWindow | null = null;
let currentOfferHandler: ((event: any, data: any) => void) | null = null;
let currentCandidateHandler: ((event: any, data: any) => void) | null = null;
let currentSocket: Socket | null = null;
let tempHtmlPath: string | null = null;

export async function startScreenShare(socket: Socket, payload: { sessaoId: string }) {
  if (peerWindow) {
    stopScreenShare();
  }

  currentSocket = socket;

  const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
  const primarySource = sources[0];
  if (!primarySource) {
    console.error("[agent-webrtc] No screen sources found.");
    return;
  }
  const screenId = primarySource.id;

  peerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const html = `
    <html><body><script>
      const { ipcRenderer } = require('electron');
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: '${screenId}', maxFrameRate: 30 } }
          });
          const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          
          let remoteDescriptionSet = false;
          const candidateQueue = [];

          stream.getTracks().forEach(t => pc.addTrack(t, stream));
          
          pc.onicecandidate = (e) => {
            if (e.candidate) {
              ipcRenderer.send('webrtc:candidate', { sessaoId: '${payload.sessaoId}', candidate: e.candidate.toJSON() });
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ipcRenderer.send('webrtc:offer', { sessaoId: '${payload.sessaoId}', offer });

          ipcRenderer.on('webrtc:answer', async (_, data) => {
            if (data.sessaoId !== '${payload.sessaoId}') return;
            try {
              await pc.setRemoteDescription(data.answer);
              remoteDescriptionSet = true;
              for (const cand of candidateQueue) {
                await pc.addIceCandidate(cand).catch(err => console.error('Error adding queued candidate:', err));
              }
              candidateQueue.length = 0;
            } catch (err) {
              console.error('Error setting remote description of answer:', err);
            }
          });

          ipcRenderer.on('webrtc:candidate-remote', async (_, data) => {
            if (data.sessaoId !== '${payload.sessaoId}' || !data.candidate) return;
            if (!remoteDescriptionSet) {
              candidateQueue.push(data.candidate);
            } else {
              await pc.addIceCandidate(data.candidate).catch(err => console.error('Error adding remote candidate:', err));
            }
          });
        } catch (err) {
          console.error('Error in agent screen share runner:', err);
        }
      })();
    </script></body></html>`;

  tempHtmlPath = path.join(app.getPath("userData"), `webrtc_session_${payload.sessaoId}.html`);
  fs.writeFileSync(tempHtmlPath, html, "utf-8");

  await peerWindow.loadFile(tempHtmlPath);

  currentOfferHandler = (_: unknown, data: { sessaoId: string; offer: RTCSessionDescriptionInit }) => {
    socket.emit(remoteSocketEvents.webRtcOffer, data);
  };
  currentCandidateHandler = (_: unknown, data: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
    socket.emit(remoteSocketEvents.webRtcCandidate, data);
  };

  ipcMain.on("webrtc:offer", currentOfferHandler);
  ipcMain.on("webrtc:candidate", currentCandidateHandler);

  socket.on(remoteSocketEvents.webRtcAnswer, (_data: { sessaoId: string; answer: RTCSessionDescriptionInit }) => {
    if (peerWindow && !peerWindow.isDestroyed()) {
      peerWindow.webContents.send("webrtc:answer", _data);
    }
  });
  
  socket.on(remoteSocketEvents.webRtcCandidate, (_data: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
    if (peerWindow && !peerWindow.isDestroyed()) {
      peerWindow.webContents.send("webrtc:candidate-remote", _data);
    }
  });
}

export function stopScreenShare() {
  if (peerWindow) {
    try {
      peerWindow.close();
    } catch {
      // Ignore if already closed
    }
    peerWindow = null;
  }

  if (tempHtmlPath) {
    try {
      fs.unlinkSync(tempHtmlPath);
    } catch {
      // Ignore cleanup error
    }
    tempHtmlPath = null;
  }

  if (currentOfferHandler) {
    ipcMain.off("webrtc:offer", currentOfferHandler);
    currentOfferHandler = null;
  }
  if (currentCandidateHandler) {
    ipcMain.off("webrtc:candidate", currentCandidateHandler);
    currentCandidateHandler = null;
  }

  if (currentSocket) {
    currentSocket.off(remoteSocketEvents.webRtcAnswer);
    currentSocket.off(remoteSocketEvents.webRtcCandidate);
    currentSocket = null;
  }
}

