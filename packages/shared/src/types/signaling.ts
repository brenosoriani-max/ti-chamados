export type WebRtcOfferPayload = {
  sessaoId: string;
  offer: RTCSessionDescriptionInit;
};

export type WebRtcAnswerPayload = {
  sessaoId: string;
  answer: RTCSessionDescriptionInit;
};

export type WebRtcCandidatePayload = {
  sessaoId: string;
  candidate: RTCIceCandidateInit;
};

export type QualityPreset = "720p" | "1080p" | "1440p" | "4K";
export type FpsPreset = 15 | 30 | 60;

export type QualityChangePayload = {
  sessaoId: string;
  resolution: QualityPreset;
  fps: FpsPreset;
};
