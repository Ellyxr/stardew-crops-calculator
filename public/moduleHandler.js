// main.js - Main entry point, imports and initializes other modules

// Import essential functions from other modules
import { updateNoCropsUI } from './ui.js'; // Import the function to update initial UI state
// You might not need to import updateTable or updateGraph directly here,
// as ui.js handles its own initialization and event listeners.

// Import other functions if you need them directly in main.js for specific startup tasks
// import { initializeChart } from './ui.js'; // Example if needed here
// import { setCropDetails } from './data.js'; // Example if loading initial data here
// import { GAME_CONSTANTS } from './config.js'; // Example if needed here

// Optional: Log a message indicating the main module is loaded
console.log("Main application module loaded.");

// The main initialization logic runs when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded. Initializing application...");

  // Initialize the UI state (e.g., hide 'no crops' message if data exists, show empty chart)
  // This function is defined in ui.js and manages the initial visibility of UI elements
  updateNoCropsUI();

  // Any other initialization logic that needs to happen *after* the DOM is ready
  // and *after* other modules have potentially set up their listeners (like in ui.js)
  // can go here.

  console.log("Application initialized.");
});

// Optional: You could also export something from main.js if other external scripts need to interact with the app state
// export { cropDetails }; // Example: if another script needed direct access (less common with modules managing state)