import { invoke } from "@tauri-apps/api/core";

window.addEventListener("DOMContentLoaded", () => {
  window.focus();

  document.querySelector("#test")?.addEventListener("click", () => {
    console.log("Button Clicked");
  });

  setTimeout(() => {
    window.focus();
    console.log("Focused element:", document.activeElement);
  }, 0);

  window.addEventListener("click", () => {
    window.focus();
  });

  render();
});

interface AttoSnapshot {
  buffer: string[];
  cursor_x: number;
  cursor_y: number;
  mode: string;
}

let state: AttoSnapshot = {
  buffer: [""],
  cursor_x: 0,
  cursor_y: 0,
  mode: "Insert",
};

async function dispatch(action: string, payload?: string) {
  state = await invoke<AttoSnapshot>("atto_action", {
    action,
    payload: payload ?? null,
  });
  console.log("state from rust:", state);
  render();
}

window.addEventListener("keydown", async (e) => {
  e.preventDefault();
  console.log(e.key);

  switch (e.key) {
    case "Enter":
      await dispatch("new_line");
      break;
    case "Backspace":
      await dispatch("backspace");
      break;
    case "ArrowRight":
      await dispatch("move_right");
      break;
    case "ArrowLeft":
      await dispatch("move_left");
      break;
    case "ArrowUp":
      await dispatch("move_up");
      break;
    case "ArrowDown":
      await dispatch("move_down");
      break;
    default:
      if (e.key.length === 1) {
        await dispatch("insert_char", e.key);
        break;
      }
  }
});

let blinkTimeout: number | null = null;

function render() {
  const atto = document.querySelector("#atto") as HTMLElement;
  atto.innerHTML = "";

  state.buffer.forEach((line, y) => {
    const lineDiv = document.createElement("div");
    lineDiv.style.whiteSpace = "pre";

    if (y === state.cursor_y) {
      const before = document.createTextNode(line.slice(0, state.cursor_x));
      const cursor = document.createElement("span");
      const after = document.createTextNode(line.slice(state.cursor_x + 1));

      cursor.className = "cursor";
      cursor.textContent = line[state.cursor_x] || " ";

      lineDiv.appendChild(before);
      lineDiv.appendChild(cursor);
      lineDiv.appendChild(after);
    } else {
      lineDiv.textContent = line || "\u00A0";
    }

    atto.appendChild(lineDiv);
  });

  if (blinkTimeout) clearTimeout(blinkTimeout);
  blinkTimeout = window.setTimeout(() => {
    const cursor = document.querySelector(".cursor") as HTMLElement;
    if (cursor) cursor.classList.remove("active");
  }, 500);
}
