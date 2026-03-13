window.addEventListener("DOMContentLoaded", () => {
  window.focus();

  setTimeout(() => {
    window.focus();
    console.log("Focused element:", document.activeElement);
  }, 0);

  window.addEventListener("click", () => {
    window.focus();
  });

  render();
});

let buffer: Array<string> = [""];
let cursorX = 0;
let cursorY = 0;
let blinkTimeout: number | null = null;

window.addEventListener("keydown", (e) => {
  if (e.key.length === 1) {
    const line = buffer[cursorY];
    buffer[cursorY] = line.slice(0, cursorX) + e.key + line.slice(cursorX);
    cursorX++;
  } else if (e.key === "Backspace") {
    if (cursorX > 0) {
      const line = buffer[cursorY];
      buffer[cursorY] = line.slice(0, cursorX - 1) + line.slice(cursorX);
      cursorX--;
    }
  } else if (e.key === "Enter") {
    const line = buffer[cursorY];
    const before = line.slice(0, cursorX);
    const after = line.slice(cursorX);
    buffer[cursorY] = before;
    buffer.splice(cursorY + 1, 0, after);
    cursorY++;
    cursorX = 0;
  }
  render();
  e.preventDefault();
});

function render() {
  const atto = document.querySelector("#atto") as HTMLElement;

  atto.innerHTML = "";

  buffer.forEach((line, y) => {
    const lineDiv = document.createElement("div");
    lineDiv.style.whiteSpace = "pre";

    if (y === cursorY) {
      const before = document.createTextNode(line.slice(0, cursorX));
      const cursor = document.createElement("span");
      const after = document.createTextNode(line.slice(cursorX + 1));

      cursor.className = "cursor";
      cursor.textContent = line[cursorX] || " ";

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
