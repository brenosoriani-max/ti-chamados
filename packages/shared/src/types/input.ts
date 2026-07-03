export type MouseMovePayload = {
  sessaoId: string;
  x: number;
  y: number;
  screenWidth: number;
  screenHeight: number;
};

export type MouseClickPayload = {
  sessaoId: string;
  x: number;
  y: number;
  button: "left" | "right" | "middle";
  double?: boolean;
  screenWidth: number;
  screenHeight: number;
};

export type MouseScrollPayload = {
  sessaoId: string;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
};

export type KeyboardKeyPayload = {
  sessaoId: string;
  key: string;
  code: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
};
