export type MouseButton = "left" | "right" | "middle";

export interface MouseMovePayload {
  /**
   * Coordenada X absoluta da tela.
   */
  x: number;

  /**
   * Coordenada Y absoluta da tela.
   */
  y: number;
}

export interface MouseClickPayload {
  /**
   * Coordenada X onde ocorrerá o clique.
   */
  x: number;

  /**
   * Coordenada Y onde ocorrerá o clique.
   */
  y: number;

  /**
   * Botão do mouse.
   */
  button: MouseButton;

  /**
   * Clique duplo.
   */
  double?: boolean;
}

export interface MouseScrollPayload {
  /**
   * Scroll horizontal.
   */
  deltaX: number;

  /**
   * Scroll vertical.
   */
  deltaY: number;
}

export interface KeyboardKeyPayload {
  /**
   * Valor da tecla.
   * Ex.: "a", "A", "Enter", "Escape", "ArrowUp"
   */
  key: string;

  /**
   * Código físico da tecla.
   * Ex.: "KeyA", "Enter", "ArrowUp"
   */
  code: string;

  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;

  repeat?: boolean;
}

export interface ClipboardPayload {
  text: string;
}

export interface FileTransferChunkPayload {
  transferId: string;
  fileName: string;
  chunk: ArrayBuffer;
  index: number;
  totalChunks: number;
}

export interface FileTransferStartPayload {
  transferId: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface FileTransferEndPayload {
  transferId: string;
}

export interface ScreenResolutionPayload {
  width: number;
  height: number;
}

export interface DisplayInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  primary: boolean;
}

export interface SelectMonitorPayload {
  monitorId: string;
}