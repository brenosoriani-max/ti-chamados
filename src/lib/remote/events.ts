export {
  remoteSocketEvents,
  defaultRtcConfiguration,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
} from "@shared/events";
export type { RemoteSocketEvent } from "@shared/events";

export type {
  TerminalRegisterPayload,
  TerminalHeartbeatPayload,
  TerminalRegisteredPayload,
  TerminalUpdatedPayload,
  SessionCreatePayload,
  SessionAcceptPayload,
  SessionRejectPayload,
  SessionEndPayload,
  SessionStatePayload,
  WebRtcOfferPayload,
  WebRtcAnswerPayload,
  WebRtcCandidatePayload,
  QualityChangePayload,
  MouseMovePayload,
  MouseClickPayload,
  MouseScrollPayload,
  KeyboardKeyPayload,
  ClipboardSetPayload,
  ClipboardGetPayload,
  ClipboardResponsePayload,
  FileTransferStartPayload,
  FileTransferChunkPayload,
  FileTransferEndPayload,
  FileTransferCancelPayload,
} from "@shared/index";
