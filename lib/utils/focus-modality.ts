let initialized = false;
let lastInteractionWasKeyboard = false;

const KEYBOARD_NAV_KEYS = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  " ",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

function ensureFocusModalityListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const markPointer = () => {
    lastInteractionWasKeyboard = false;
  };

  const markKeyboard = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (KEYBOARD_NAV_KEYS.has(e.key)) {
      lastInteractionWasKeyboard = true;
    }
  };

  window.addEventListener("pointerdown", markPointer, { capture: true, passive: true });
  window.addEventListener("mousedown", markPointer, { capture: true, passive: true });
  window.addEventListener("touchstart", markPointer, { capture: true, passive: true });
  window.addEventListener("keydown", markKeyboard, { capture: true, passive: true });
}

if (typeof window !== "undefined") {
  ensureFocusModalityListeners();
}

export function wasLastInteractionKeyboard(): boolean {
  ensureFocusModalityListeners();
  return lastInteractionWasKeyboard;
}

/**
 * Prevents Radix from programmatically returning focus to a trigger button
 * when a menu, select, popover, or dialog is closed via pointer interaction,
 * avoiding sticky :focus-visible outlines on mouse clicks while keeping keyboard focus intact.
 */
export function createCloseAutoFocusHandler(
  userHandler?: (event: Event) => void
) {
  return (event: Event) => {
    userHandler?.(event);
    if (!event.defaultPrevented && !wasLastInteractionKeyboard()) {
      event.preventDefault();
    }
  };
}
