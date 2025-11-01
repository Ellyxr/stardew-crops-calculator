// main.js - Main entry point, imports and initializes other modules

import { updateNoCropsUI } from './ui.js'; 

console.log("Main application module loaded.");

// The main initialization logic runs when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded. Initializing application...");
  updateNoCropsUI();

  console.log("Application initialized.");
});