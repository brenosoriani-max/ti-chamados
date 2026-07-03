import { BrowserWindow } from "electron";
import path from "path";
import type { Socket } from "socket.io-client";
import { remoteSocketEvents } from "../socket/client";

let peerWindow: BrowserWindow | null = null;

export async function startScreenShare(socket: Socket, payload: { sessaoId: string }) {
  if (peerWindow) peerWindow.close();

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
      const { desktopCapturer } = require('electron');
      (async () => {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sources[0].id, maxFrameRate: 30 } }
        });
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        pc.onicecandidate = (e) => e.candidate && ipcRenderer.send('webrtc:candidate', { sessaoId: '${payload.sessaoId}', candidate: e.candidate.toJSON() });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ipcRenderer.send('webrtc:offer', { sessaoId: '${payload.sessaoId}', offer });
        ipcRenderer.on('webrtc:answer', async (_, data) => {
          if (data.sessaoId !== '${payload.sessaoId}') return;
          await pc.setRemoteDescription(data.answer);
        });
        ipcRenderer.on('webrtc:candidate-remote', async (_, data) => {
          if (data.sessaoId !== '${payload.sessaoId}' || !data.candidate) return;
          await pc.addIceCandidate(data.candidate);
        });
      })();
    </script></body></html>`;

  await peerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  const { ipcMain } = await import("electron");
  const offerHandler = (_: unknown, data: { sessaoId: string; offer: RTCSessionDescriptionInit }) => {
    socket.emit(remoteSocketEvents.webRtcOffer, data);
  };
  const candidateHandler = (_: unknown, data: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
    socket.emit(remoteSocketEvents.webRtcCandidate, data);
  };

  ipcMain.on("webrtc:offer", offerHandler);
  ipcMain.on("webrtc:candidate", candidateHandler);

  socket.on(remoteSocketEvents.webRtcAnswer, (_data: { sessaoId: string; answer: RTCSessionDescriptionInit }) => {
    peerWindow?.webContents.send("webrtc:answer", _data);
  });
  socket.on(remoteSocketEvents.webRtcCandidate, (_data: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
    peerWindow?.webContents.send("webrtc:candidate-remote", _data);
  });
}

export function stopScreenShare() {
  peerWindow?.close();
  peerWindow = null;
}
