import { invoke } from "@tauri-apps/api/core"; //  Calls Rust commands, allowing frontend/backend communication
import { getCurrentWindow } from "@tauri-apps/api/window";

window.addEventListener("DOMContentLoaded", () => {
  // This section sets up initial event listeners
  window.focus(); // and focuses the window when the DOM is ready.
  //
  document.querySelector("#save")?.addEventListener("click", () => {
    console.log("Save Clicked");
  });

  document.querySelector("#save-as")?.addEventListener("click", () => {
    console.log("Save As Clicked");
  });

  document.querySelector("#load")?.addEventListener("click", () => {
    console.log("Load Clicked");
  });

  document.querySelector("#exit")?.addEventListener("click", async () => {
    await getCurrentWindow().close();
  });

  setTimeout(() => {
    // This part sets logging and focusing
    window.focus(); // to the next event loop tick, ensuring
    console.log("Focused element:", document.activeElement); // the program remains ready.
  }, 0); //
  //
  window.addEventListener("click", () => {
    // This refocuses the window upon any
    window.focus(); // click, maintaining visual feedback
  }); // and readiness.
  //
  render(); // Initially renders the editor state.
}); //

interface AttoSnapshot {
  //
  buffer: string[]; // An array of strings (Each is one line of text).
  cursor_x: number; // Cursor X co-ordinates.
  cursor_y: number; // Cursor Y co-ordinates.
  mode: string; // Editor mode?
} //

let state: AttoSnapshot = {
  //
  buffer: [""], // This all holds the
  cursor_x: 0, // current editor
  cursor_y: 0, // state, on the
  mode: "Insert", // frontend
}; //

async function dispatch(action: string, payload?: string) {
  // This relays an action to the Rust
  state = await invoke<AttoSnapshot>("atto_action", {
    // backend via Tauri. It calls the
    action, // "atto_action" command expecting a
    payload: payload ?? null, // response which matches the
  }); // AttoSnapshot interface.
  console.log("state from rust:", state); // It then updates the state with the
  render(); // response, and updates the UI.
} //

window.addEventListener("keydown", async (e) => {
  // This section does keyboard event
  e.preventDefault(); // handling. It prevents default browser
  console.log(e.key); // behaviour, allowing full input control.
  // It also logs the pressed key for debugging.
  switch (
    e.key // Switch cases are then used to respond to
  ) {
    case "Enter": // certain keystrokes.
      await dispatch("new_line"); // Enter creates a new line.
      break; //
    case "Backspace": // Backspace deletes the character before
      await dispatch("backspace"); // the cursor.
      break;
    case "Tab":
      await dispatch("insert_tab");
      break;
    case "ArrowRight": //
      await dispatch("move_right"); //
      break; // The arrow keys move
    case "ArrowLeft": // the cursor one unit
      await dispatch("move_left"); // of space (line or character)
      break; // in the corresponding
    case "ArrowUp": // direction.
      await dispatch("move_up"); //
      break; //
    case "ArrowDown": //
      await dispatch("move_down"); //
      break; // ----------------------
    default: // This is the default case
      if (e.key.length === 1) {
        // which simply sends the order
        await dispatch("insert_char", e.key); // to insert that character.
        break; // ----------------------
      } //  WHAT IF THE BACKEND DOESN'T RETURN A VALID STATE?
  }
});

let blinkTimeout: number | null = null;

function render() {
  // This simply updates the DOM to reflect
  const atto = document.querySelector("#atto") as HTMLElement; // the current editor state, and
  atto.innerHTML = ""; // it clears the content of the element.

  state.buffer.forEach((line, y) => {
    // Creates a buffer for each line
    const lineDiv = document.createElement("div"); // using whitespace: "pre"
    lineDiv.style.whiteSpace = "pre"; // to preserve spaces.

    if (y === state.cursor_y) {
      // If the line has the cursor on it:
      const before = document.createTextNode(line.slice(0, state.cursor_x)); // It splits it into 3 "zones": Before cursor,
      const cursor = document.createElement("span"); // cursor character, and after cursor.
      const after = document.createTextNode(line.slice(state.cursor_x + 1)); //
      //
      cursor.className = "cursor"; // It then wraps the cursor character
      cursor.textContent = line[state.cursor_x] || " "; // in a "cursor" class.
      //
      lineDiv.appendChild(before); // If the cursor is at the end
      lineDiv.appendChild(cursor); // of a line, show a space.
      lineDiv.appendChild(after); // Otherwise, set the text content directly.
    } else {
      //
      lineDiv.textContent = line || "\u00A0"; //
    } //
    //
    atto.appendChild(lineDiv); //
  }); //
  //
  if (blinkTimeout) clearTimeout(blinkTimeout); // This section handles cursor blinking.
  blinkTimeout = window.setTimeout(() => {
    // After 500ms, it switches the state
    const cursor = document.querySelector(".cursor") as HTMLElement; // back and forth between visible
    if (cursor) cursor.classList.remove("active"); // and invisible.
  }, 500); //
} //
//
