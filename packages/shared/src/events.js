"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEARTBEAT_TIMEOUT_MS = exports.HEARTBEAT_INTERVAL_MS = exports.defaultRtcConfiguration = exports.remoteSocketEvents = void 0;
exports.remoteSocketEvents = {
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
    clipboardGet: "clipboard:get",
    clipboardSet: "clipboard:set",
    fileTransferStart: "file:start",
    fileTransferChunk: "file:chunk",
    fileTransferEnd: "file:end",
    fileTransferCancel: "file:cancel",
    qualityChange: "quality:change",
};
exports.defaultRtcConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
exports.HEARTBEAT_INTERVAL_MS = 20_000;
exports.HEARTBEAT_TIMEOUT_MS = 60_000;
