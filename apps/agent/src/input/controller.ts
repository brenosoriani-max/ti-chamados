import {
  mouse,
  keyboard,
  Button,
  Key,
  Point,
} from "@nut-tree-fork/nut-js";
import { screen } from "electron";

import type {
  MouseClickPayload,
  MouseMovePayload,
  MouseScrollPayload,
  KeyboardKeyPayload,
} from "../../../../packages/shared/src/types/input";

function mapButton(button: string): Button {
  switch (button) {
    case "right":
      return Button.RIGHT;

    case "middle":
      return Button.MIDDLE;

    default:
      return Button.LEFT;
  }
}


function toScreenPoint(xPercent: number, yPercent: number): Point {
  const primary = screen.getPrimaryDisplay();
  const x = Math.round(xPercent * primary.size.width);
  const y = Math.round(yPercent * primary.size.height);
  return new Point(x, y);
}

function mapKey(payload: KeyboardKeyPayload): Key {
  const { key, code } = payload;

  // Letras: code = "KeyA".."KeyZ"
  if (code.startsWith("Key") && code.length === 4) {
    const letter = code.replace("Key", "");
    const mapped = Key[letter as keyof typeof Key];
    if (mapped !== undefined) return mapped;
  }

  // Dígitos: code = "Digit0".."Digit9"
  if (code.startsWith("Digit")) {
    const digit = code.replace("Digit", "");
    const mapped = Key[`Num${digit}` as keyof typeof Key];
    if (mapped !== undefined) return mapped;
  }

  switch (key) {
    case "Enter":
      return Key.Enter;
    case "Escape":
      return Key.Escape;
    case "Backspace":
      return Key.Backspace;
    case "Tab":
      return Key.Tab;
    case "Delete":
      return Key.Delete;
    case " ":
    case "Spacebar":
      return Key.Space;
    case "ArrowUp":
      return Key.Up;
    case "ArrowDown":
      return Key.Down;
    case "ArrowLeft":
      return Key.Left;
    case "ArrowRight":
      return Key.Right;
    case "Shift":
      return Key.LeftShift;
    case "Control":
      return Key.LeftControl;
    case "Alt":
      return Key.LeftAlt;
    case "Meta":
      return Key.LeftWin;
    case "CapsLock":
      return Key.CapsLock;
    case "Home":
      return Key.Home;
    case "End":
      return Key.End;
    case "PageUp":
      return Key.PageUp;
    case "PageDown":
      return Key.PageDown;
    default: {
      // Fallback: tenta casar direto pelo nome da tecla (ex: F1, F2...)
      const upper = key.length === 1 ? key.toUpperCase() : key;
      const mapped = Key[upper as keyof typeof Key];
      return mapped !== undefined ? mapped : Key.Space;
    }
  }
}

export async function handleMouseMove(payload: MouseMovePayload) {
  await mouse.setPosition(toScreenPoint(payload.x, payload.y));
}

export async function handleMouseClick(payload: MouseClickPayload) {
  await mouse.setPosition(toScreenPoint(payload.x, payload.y));

  const button = mapButton(payload.button);

  if (payload.double) {
    await mouse.doubleClick(button);
  } else {
    await mouse.click(button);
  }
}

export async function handleMouseScroll(payload: MouseScrollPayload) {
  if (payload.deltaY > 0) {
    await mouse.scrollDown(payload.deltaY);
  } else if (payload.deltaY < 0) {
    await mouse.scrollUp(Math.abs(payload.deltaY));
  }
}

export async function handleKeyboardKey(
  payload: KeyboardKeyPayload,
  type: "down" | "up"
) {
  const key = mapKey(payload);

  if (type === "down") {
    await keyboard.pressKey(key);
  } else {
    await keyboard.releaseKey(key);
  }
}