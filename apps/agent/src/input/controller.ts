import {
  mouse,
  keyboard,
  Button,
  Key,
  Point,
} from "@nut-tree-fork/nut-js";

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

function mapKey(payload: KeyboardKeyPayload): Key | string {
  const { key, code } = payload;

  if (code.startsWith("Key")) {
    return code.replace("Key", "").toLowerCase();
  }

  if (key.length === 1) {
    return key.toLowerCase();
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

    default:
      return key.toLowerCase();
  }
}

export async function handleMouseMove(
  payload: MouseMovePayload
) {
  await mouse.setPosition(
    new Point(
      Math.round(payload.x),
      Math.round(payload.y)
    )
  );
}

export async function handleMouseClick(
  payload: MouseClickPayload
) {
  await mouse.setPosition(
    new Point(
      Math.round(payload.x),
      Math.round(payload.y)
    )
  );

  const button = mapButton(payload.button);

  if (payload.double) {
    await mouse.doubleClick(button);
  } else {
    await mouse.click(button);
  }
}

export async function handleMouseScroll(
  payload: MouseScrollPayload
) {
  await mouse.scrollDown(payload.deltaY);
}

export async function handleKeyboardKey(
  payload: KeyboardKeyPayload,
  type: "down" | "up"
) {
  const key = mapKey(payload);

  if (payload.ctrlKey) {
    await keyboard.pressKey(Key.LeftControl);
  }

  if (payload.shiftKey) {
    await keyboard.pressKey(Key.LeftShift);
  }

  if (payload.altKey) {
    await keyboard.pressKey(Key.LeftAlt);
  }

  if (type === "down") {
    await keyboard.pressKey(key as Key);
  } else {
    await keyboard.releaseKey(key as Key);
  }

  if (payload.altKey) {
    await keyboard.releaseKey(Key.LeftAlt);
  }

  if (payload.shiftKey) {
    await keyboard.releaseKey(Key.LeftShift);
  }

  if (payload.ctrlKey) {
    await keyboard.releaseKey(Key.LeftControl);
  }
}