export const remoteSocketEvents = {
  terminalRegister: "terminal:register",
  terminalRegistered: "terminal:registered",
  terminalHeartbeat: "terminal:heartbeat",
  terminalDisconnect: "terminal:disconnect",
  terminalUpdated: "terminal:updated",
  sessionCreate: "sessao:create",
  sessionAccept: "sessao:accept",
  sessionReject: "sessao:reject",
  sessionEnd: "sessao:end",
  sessionState: "sessao:state",
  webRtcOffer: "webrtc:offer",
  webRtcAnswer: "webrtc:answer",
  webRtcCandidate: "webrtc:candidate",
  mouseMove: "mouse:move",
  mouseClick: "mouse:click",
  mouseScroll: "mouse:scroll",
  keyboardKeyDown: "keyboard:keyDown",
  keyboardKeyUp: "keyboard:keyUp",
  keyboardType: "keyboard:type",
  clipboardGet: "clipboard:get",
  clipboardSet: "clipboard:set",
  fileTransferStart: "file:start",
  fileTransferChunk: "file:chunk",
  fileTransferEnd: "file:end",
  fileTransferCancel: "file:cancel",
  qualityChange: "quality:change",
} as const;

export type RemoteSocketEvent = (typeof remoteSocketEvents)[keyof typeof remoteSocketEvents];

export const defaultRtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 4,
};

export const HEARTBEAT_INTERVAL_MS = 20_000;
export const HEARTBEAT_TIMEOUT_MS = 60_000;
