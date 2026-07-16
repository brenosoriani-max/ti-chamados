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
  KeyboardTypePayload,
} from "../../../../packages/shared/src/types/input";

// Remove delays artificiais do nut-js (por padrão ~300ms entre teclas no type(),
// e delay entre mouse down/up nos clicks). Isso é o principal culpado do "delay".
keyboard.config.autoDelayMs = 0;
mouse.config.autoDelayMs = 0;

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

// Mapa por "code" (posição física da tecla, independente de layout).
// É a fonte primária de verdade — mais confiável que "key" pra teclas não-imprimíveis.
const CODE_KEY_MAP: Record<string, Key> = {
  // Letras
  ...Object.fromEntries(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => [`Key${l}`, Key[l as keyof typeof Key]])
  ),
  // Dígitos linha superior
  Digit0: Key.Num0, Digit1: Key.Num1, Digit2: Key.Num2, Digit3: Key.Num3, Digit4: Key.Num4,
  Digit5: Key.Num5, Digit6: Key.Num6, Digit7: Key.Num7, Digit8: Key.Num8, Digit9: Key.Num9,
  // Numpad
  Numpad0: Key.NumPad0, Numpad1: Key.NumPad1, Numpad2: Key.NumPad2, Numpad3: Key.NumPad3,
  Numpad4: Key.NumPad4, Numpad5: Key.NumPad5, Numpad6: Key.NumPad6, Numpad7: Key.NumPad7,
  Numpad8: Key.NumPad8, Numpad9: Key.NumPad9,
  NumpadAdd: Key.Add, NumpadSubtract: Key.Subtract, NumpadMultiply: Key.Multiply,
  NumpadDivide: Key.Divide, NumpadDecimal: Key.Decimal, NumpadEnter: Key.Enter,
  // Função
  F1: Key.F1, F2: Key.F2, F3: Key.F3, F4: Key.F4, F5: Key.F5, F6: Key.F6,
  F7: Key.F7, F8: Key.F8, F9: Key.F9, F10: Key.F10, F11: Key.F11, F12: Key.F12,
  // Controle / navegação
  Enter: Key.Enter,
  Escape: Key.Escape,
  Backspace: Key.Backspace,
  Tab: Key.Tab,
  Delete: Key.Delete,
  Space: Key.Space,
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
  Home: Key.Home,
  End: Key.End,
  PageUp: Key.PageUp,
  PageDown: Key.PageDown,
  Insert: Key.Insert,
  CapsLock: Key.CapsLock,
  ContextMenu: Key.Menu,
  // Modificadores (esquerda/direita)
  ShiftLeft: Key.LeftShift,
  ShiftRight: Key.RightShift,
  ControlLeft: Key.LeftControl,
  ControlRight: Key.RightControl,
  AltLeft: Key.LeftAlt,
  AltRight: Key.RightAlt,
  MetaLeft: Key.LeftWin,
  MetaRight: Key.RightWin,
  // Pontuação (layout US físico)
  Minus: Key.Minus,
  Equal: Key.Equal,
  BracketLeft: Key.LeftBracket,
  BracketRight: Key.RightBracket,
  Backslash: Key.Backslash,
  Semicolon: Key.Semicolon,
  Quote: Key.Quote,
  Comma: Key.Comma,
  Period: Key.Period,
  Slash: Key.Slash,
  Backquote: Key.Grave,
};

function mapKey(payload: KeyboardKeyPayload): Key | undefined {
  const { key, code } = payload;

  if (code && CODE_KEY_MAP[code] !== undefined) {
    return CODE_KEY_MAP[code];
  }

  // Fallback por "key" só pra casos sem "code" reconhecido (ex: teclas especiais de layout)
  switch (key) {
    case "Enter": return Key.Enter;
    case "Escape": return Key.Escape;
    case "Backspace": return Key.Backspace;
    case "Tab": return Key.Tab;
    case "Delete": return Key.Delete;
    case " ":
    case "Spacebar": return Key.Space;
    case "Shift": return Key.LeftShift;
    case "Control": return Key.LeftControl;
    case "Alt": return Key.LeftAlt;
    case "Meta": return Key.LeftWin;
    default: {
      if (key && key.length === 1) {
        const upper = key.toUpperCase();
        const mapped = Key[upper as keyof typeof Key];
        if (mapped !== undefined) return mapped;
      }
      // Tecla não mapeada: NÃO cai mais em Key.Space (isso poluía a digitação
      // com espaços toda vez que uma tecla desconhecida, ex: acento, chegava).
      return undefined;
    }
  }
}

/**
 * ===================================
 * Mouse: buffer + loop dedicado
 * ===================================
 * Em vez de dar await em cada evento de mousemove (que chega em alta frequência
 * e cria fila/atraso acumulado), guardamos só a posição mais recente e um loop
 * dedicado aplica sempre a última posição pendente. Eventos intermediários
 * "obsoletos" são descartados, eliminando o delay perceptível.
 */
let pendingMouseMove: MouseMovePayload | null = null;
let mouseLoopStarted = false;

async function startMouseLoop() {
  mouseLoopStarted = true;

  while (true) {
    if (pendingMouseMove) {
      const move = pendingMouseMove;
      pendingMouseMove = null;

      try {
        await mouse.setPosition(toScreenPoint(move.x, move.y));
      } catch (err) {
        console.error("[Agent] Mouse move error:", err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 8));
  }
}

export function handleMouseMove(payload: MouseMovePayload) {
  pendingMouseMove = payload;

  if (!mouseLoopStarted) {
    void startMouseLoop();
  }
}

export async function handleMouseClick(payload: MouseClickPayload) {
  try {
    await mouse.setPosition(toScreenPoint(payload.x, payload.y));

    const button = mapButton(payload.button);

    if (payload.double) {
      await mouse.doubleClick(button);
    } else {
      await mouse.click(button);
    }
  } catch (err) {
    console.error("[Agent] Mouse click error:", err);
  }
}

export async function handleMouseScroll(payload: MouseScrollPayload) {
  try {
    const amount = Math.max(1, Math.round(Math.abs(payload.deltaY) / 120));

    if (payload.deltaY > 0) {
      await mouse.scrollDown(amount);
    } else if (payload.deltaY < 0) {
      await mouse.scrollUp(amount);
    }
  } catch (err) {
    console.error("[Agent] Mouse scroll error:", err);
  }
}

export async function handleKeyboardKey(
  payload: KeyboardKeyPayload,
  type: "down" | "up"
) {
  try {
    const mappedKey = mapKey(payload);

    if (mappedKey === undefined) {
      // Tecla desconhecida (ex: acento em outro layout) — ignora em vez de
      // digitar algo errado. Use handleTypeText pra escrita de texto livre.
      return;
    }

    if (type === "down") {
      await keyboard.pressKey(mappedKey);
    } else {
      await keyboard.releaseKey(mappedKey);
    }
  } catch (err) {
    console.error("[Agent] Keyboard error:", err);
  }
}

export async function handleTypeText(
  payload: KeyboardTypePayload
) {
  try {
    if (!payload?.text) return;
    await keyboard.type(payload.text);
  } catch (err) {
    console.error("[Agent] Type text error:", err);
  }
}