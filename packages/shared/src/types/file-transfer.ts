export type FileTransferStartPayload = {
  sessaoId: string;
  transferId: string;
  fileName: string;
  fileSize: number;
  direction: "upload" | "download";
};

export type FileTransferChunkPayload = {
  sessaoId: string;
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
};

export type FileTransferEndPayload = {
  sessaoId: string;
  transferId: string;
};

export type FileTransferCancelPayload = {
  sessaoId: string;
  transferId: string;
};
