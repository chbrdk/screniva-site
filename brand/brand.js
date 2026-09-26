const toast = document.getElementById("toast");
const recLabel = document.querySelector(".topbar__rec");
let toastTimer;
let started = performance.now();

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-on"), 1400);
}

async function copyHex(hex) {
  try {
    await navigator.clipboard.writeText(hex);
    showToast(`${hex} kopiert`);
  } catch {
    showToast(hex);
  }
}

document.querySelectorAll("[data-hex]").forEach((el) => {
  el.addEventListener("click", () => {
    const hex = el.getAttribute("data-hex");
    if (hex) void copyHex(hex);
  });
});

function formatTimecode(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  const f = String(Math.floor((ms % 1000) / (1000 / 24))).padStart(2, "0");
  return `${h}:${m}:${s}:${f}`;
}

function tickRec() {
  if (!recLabel) return;
  const elapsed = performance.now() - started;
  const dot = recLabel.querySelector(".topbar__rec-dot");
  recLabel.replaceChildren();
  if (dot) recLabel.append(dot);
  else {
    const d = document.createElement("span");
    d.className = "topbar__rec-dot";
    d.setAttribute("aria-hidden", "true");
    recLabel.append(d);
  }
  recLabel.append(document.createTextNode(` Rec ${formatTimecode(elapsed)}`));
  requestAnimationFrame(tickRec);
}

tickRec();
