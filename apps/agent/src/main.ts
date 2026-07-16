
import {
  mouse,
  keyboard,
  Button,
  Key,
  Point,
} from "@nut-tree-fork/nut-js";

import { screen } from "electron";
import { KeyboardKeyPayload, MouseClickPayload, MouseMovePayload, MouseScrollPayload } from "../../../packages/shared/src/types/input";



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

/**
 * Converte coordenadas normalizadas (0-1)
 * para coordenadas reais da tela.
 *
 * Atualmente usa a tela primária.
 * Futuramente pode receber displayId
 * pelo payload para suportar múltiplos monitores.
 */
function toScreenPoint(
  xPercent: number,
  yPercent: number
): Point {
  const display = screen.getPrimaryDisplay();

  const x =
    display.bounds.x +
    Math.round(xPercent * display.size.width);

  const y =
    display.bounds.y +
    Math.round(yPercent * display.size.height);

  return new Point(x, y);
}

function mapKey(
  payload: KeyboardKeyPayload
): Key | undefined {
  const { key, code } = payload;

  if (
    code.startsWith("Key") &&
    code.length === 4
  ) {
    const letter = code.replace("Key", "");

    const mapped =
      Key[letter as keyof typeof Key];

    if (mapped !== undefined) {
      return mapped;
    }
  }

  if (code.startsWith("Digit")) {
    const digit = code.replace(
      "Digit",
      ""
    );

    const mapped =
      Key[
        `Num${digit}` as keyof typeof Key
      ];

    if (mapped !== undefined) {
      return mapped;
    }
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
      const upper =
        key.length === 1
          ? key.toUpperCase()
          : key;

      const mapped =
        Key[
          upper as keyof typeof Key
        ];

      return mapped;
    }
  }
}

/**
 * ===================================
 * Mouse movement buffer
 * ===================================
 */

let pendingMouseMove:
  | MouseMovePayload
  | null = null;

let mouseLoopStarted = false;

async function startMouseLoop() {
  mouseLoopStarted = true;

  while (true) {
    try {
      if (pendingMouseMove) {
        const move = pendingMouseMove;

        pendingMouseMove = null;

        await mouse.setPosition(
          toScreenPoint(
            move.x,
            move.y
          )
        );
      }
    } catch (err) {
      console.error(
        "[Agent] Mouse move error:",
        err
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 8)
    );
  }
}

export function handleMouseMove(
  payload: MouseMovePayload
) {
  pendingMouseMove = payload;

  if (!mouseLoopStarted) {
    void startMouseLoop();
  }
}

export async function handleMouseClick(
  payload: MouseClickPayload
) {
  try {
    await mouse.setPosition(
      toScreenPoint(
        payload.x,
        payload.y
      )
    );

    const button = mapButton(
      payload.button
    );

    if (payload.double) {
      await mouse.doubleClick(
        button
      );
    } else {
      await mouse.click(button);
    }
  } catch (err) {
    console.error(
      "[Agent] Mouse click error:",
      err
    );
  }
}

export async function handleMouseScroll(
  payload: MouseScrollPayload
) {
  try {
    const amount = Math.max(
      1,
      Math.round(
        Math.abs(payload.deltaY) /
          120
      )
    );

    if (payload.deltaY > 0) {
      await mouse.scrollDown(
        amount
      );
    } else if (
      payload.deltaY < 0
    ) {
      await mouse.scrollUp(
        amount
      );
    }
  } catch (err) {
    console.error(
      "[Agent] Mouse scroll error:",
      err
    );
  }
}

export async function handleKeyboardKey(
  payload: KeyboardKeyPayload,
  type: "down" | "up"
) {
  try {
    const mappedKey =
      mapKey(payload);

    if (!mappedKey) {
      return;
    }

    if (type === "down") {
      await keyboard.pressKey(
        mappedKey
      );
    } else {
      await keyboard.releaseKey(
        mappedKey
      );
    }
  } catch (err) {
    console.error(
      "[Agent] Keyboard error:",
      err
    );
  }
}

