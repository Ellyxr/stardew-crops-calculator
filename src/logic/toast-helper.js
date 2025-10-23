function showToast(message, options = {}) {
  const { duration = 4000, type = "info", id } = options;
  const container = ensureToastContainer();
  if (id && container.querySelector(`[data-toast-id="${id}"]`)) return null;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  if (id) toast.setAttribute("data-toast-id", id);
  toast.innerHTML = `<div class="toast-body">${message}</div><button class="toast-close" aria-label="close">×</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  const hide = () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 240);
  };
  toast.querySelector(".toast-close").addEventListener("click", hide);
  if (duration > 0) setTimeout(hide, duration);
  return toast;
}
