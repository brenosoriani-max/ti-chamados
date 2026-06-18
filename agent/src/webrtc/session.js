import { events } from "../socket/events.js";

let peer = null;

export async function startScreenShare(socket, payload) {
  if (peer) peer.close();

  if (!globalThis.RTCPeerConnection) {
    socket.emit(events.sessionReject, {
      sessaoId: payload.sessaoId,
      reason: "WebRTC nativo nao disponivel neste runtime do agente",
    });
    return;
  }

  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit(events.webRtcCandidate, {
        sessaoId: payload.sessaoId,
        candidate: event.candidate,
      });
    }
  };

  socket.on(events.webRtcAnswer, async (message) => {
    if (message.sessaoId === payload.sessaoId && peer) {
      await peer.setRemoteDescription(message.answer);
    }
  });

  socket.on(events.webRtcCandidate, async (message) => {
    if (message.sessaoId === payload.sessaoId && peer && message.candidate) {
      await peer.addIceCandidate(message.candidate);
    }
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit(events.webRtcOffer, { sessaoId: payload.sessaoId, offer });
}

export async function stopScreenShare() {
  if (peer) peer.close();
  peer = null;
}
