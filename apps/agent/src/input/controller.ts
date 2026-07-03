import robot from "robotjs";
import type { MouseClickPayload, MouseMovePayload, MouseScrollPayload, KeyboardKeyPayload } from "../../../../packages/shared/src/types/input";

function modifiers(payload: KeyboardKeyPayload) {
  const mods: string[] = [];
  if (payload.ctrlKey) mods.push("control");
  if (payload.altKey) mods.push("alt");
  if (payload.shiftKey) mods.push("shift");
  if (payload.metaKey) mods.push("command");
  return mods;
}

function mapKey(key: string, code: string) {
  if (code.startsWith("Key")) return code.replace("Key", "").toLowerCase();
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}

export function handleMouseMove(payload: MouseMovePayload) {
  robot.moveMouse(Math.round(payload.x), Math.round(payload.y));
}

export function handleMouseClick(payload: MouseClickPayload) {
  robot.moveMouse(Math.round(payload.x), Math.round(payload.y));
  const button = payload.button === "right" ? "right" : payload.button === "middle" ? "middle" : "left";
  robot.mouseClick(button, !!payload.double);
}

export function handleMouseScroll(payload: MouseScrollPayload) {
  robot.scrollMouse(payload.deltaX, payload.deltaY);
}

export function handleKeyboardKey(payload: KeyboardKeyPayload, type: "down" | "up") {
  const key = mapKey(payload.key, payload.code);
  const mods = modifiers(payload);
  robot.keyToggle(key, type, mods);
}
