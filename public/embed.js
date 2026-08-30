export function mountFrame(container, frame) {
  if (!container || !frame) {
    throw new Error("Missing browser container or Scramjet frame.");
  }

  container.replaceChildren(frame);

  frame.classList.add("proxy-frame");
  frame.setAttribute("title", "Imagination Browser");
  frame.setAttribute("allowfullscreen", "");

  return frame;
}

export function resizeFrame(frame) {
  if (!frame) return;

  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "0";
  frame.style.display = "block";
}

export function focusFrame(frame) {
  try {
    frame?.focus();
  } catch {}
}

window.embedProxyFrame = mountFrame;