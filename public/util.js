// utils.js - General utility functions

/**
 * Shows a toast notification message.
 * @param {string} message - The message to display.
 * @param {Object} options - Options for the toast (e.g., type, duration).
 */
export function showToast(message, options = {}) {
  // Your existing showToast implementation goes here
  // Example placeholder:
  const TOAST_CONTAINER_ID = "toast-container";
  function ensureToastContainer() {
    let c = document.getElementById(TOAST_CONTAINER_ID);
    if (!c) {
      c = document.createElement("div");
      c.id = TOAST_CONTAINER_ID;
      c.style.position = "fixed";
      c.style.top = "1.8rem";
      c.style.left = "50%";
      c.style.transform = "translateX(-50%)";
      c.style.display = "flex";
      c.style.flexDirection = "column";
      c.style.gap = "0.5rem";
      c.style.zIndex = "9999";
      document.body.appendChild(c);
    }
    return c;
  }
  console.log(
    `Toast: ${message} (Type: ${options.type || "default"}, Duration: ${
      options.duration || 3000
    }ms)`
  );
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
  // Implement the actual toast creation logic here (e.g., creating divs, setting styles, timeouts)
}

/**
 * Validates if a value is a finite number.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is a finite number, false otherwise.
 */
export function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Finds a crop in the database by its name (case-insensitive).
 * @param {string} name - The name of the crop to find.
 * @param {Array} db - The database array to search in (e.g., cropsDB).
 * @returns {Object|null} The crop object if found, null otherwise.
 */
export function findCropInDBByName(name, db) {
  if (!name || !db) return null;
  const n = name.trim().toLowerCase();
  return (
    db.find(
      (c) =>
        (c.id && c.id.toLowerCase() === n) ||
        (c.name && c.name.toLowerCase() === n)
    ) || null
  );
}

/**
 * Guesses the category of a crop based on its name.
 * @param {string} name - The name of the crop.
 * @returns {string} The guessed category ("fruit", "vegetable", "mushroom", "flower", "unknown").
 */
export function guessCategory(name) {
  if (!name) return "unknown";
  const n = name.toLowerCase();
  if (/\b(berry|apple|pear|grape|melon|peach|cherry|banana)\b/.test(n))
    return "fruit";
  if (/\b(mushroom|morel|fungus)\b/.test(n)) return "mushroom";
  if (/\b(flower|sunflower)\b/.test(n)) return "flower";
  return "vegetable"; // default fallback; change to "unknown" if you prefer
}

/**
 * Calculates the expected value based on quality values and drop rates.
 * @param {Object} values - An object containing values for 'normal', 'silver', 'gold', 'iridium'.
 * @param {Object} rates - An object containing drop rates for 'normal', 'silver', 'gold', 'iridium'.
 * @returns {number} The calculated expected value.
 */
export function expectedFromQuality(values, rates) {
  return (
    (values.normal || 0) * (rates.normal || 0) +
    (values.silver || 0) * (rates.silver || 0) +
    (values.gold || 0) * (rates.gold || 0) +
    (values.iridium || 0) * (rates.iridium || 0)
  );
}
