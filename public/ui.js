// * ui.js - Handles all UI interactions, DOM manipulation, and event listeners

import {
  addCrop,
  refreshCropDetailsFromTable,
  deleteCrops,
  editCrop,
  getCropDetails,
  getCropData,
  getCropLabels,
} from "./data.js";
import { showToast, isNumeric } from "./util.js";
import { recalculateAllCrops } from "./data.js";

// * --- DOM Elements (Store frequently used elements) ---
let cropListTableBody = null;
let tippyInstance = null;
let ctx = null;
let windowMyChart = null; // Store chart instance locally in this module

document.addEventListener("DOMContentLoaded", function () {
  // * LOADING SCREEN PLACEHOLDER ---------------------
  const loadingScreen = document.getElementById("loading-screen");

  // Check if the element exists (good practice)
  if (loadingScreen) {
    // Option 1: Fade out and then remove from the DOM
    loadingScreen.style.transition = "opacity 0.5s ease-out"; // Add a smooth fade-out
    loadingScreen.style.opacity = "0";
    // Wait for the fade-out transition to complete before removing
    setTimeout(() => {
      loadingScreen.remove(); // Remove the element from the DOM
    }, 500); // Match the duration of the CSS transition (0.5s)

    // Option 2: Instantly hide (less smooth)
    // loadingScreen.style.display = "none";
  } else {
    console.warn("Loading screen element with ID 'loading-screen' not found.");
  }

  // ! END LOADING SCREEN PLACEHOLDER ---------------------

  // Initialize frequently used elements
  cropListTableBody = document.querySelector("#crop-list-table tbody");

  const canvasElement = document.getElementById("crop-canvas");
  if (canvasElement) {
    ctx = canvasElement.getContext("2d");
  } else {
    console.error("Canvas element with ID 'crop-canvas' not found.");
    return; // Stop initialization if canvas is missing
  }

  ctx = document.getElementById("crop-canvas").getContext("2d");
  // Initialize chart
  initializeChart();
  updateNoCropsUI();

  // * --- Attach Event Listeners Here ---
  attachEventListeners();
  initProcessingButtons();
});

function attachEventListeners() {
  //* Visibility
  document.getElementById("crop-formField").style.display = "none";
  document.getElementById("Toast_GraphUpdated").style.display = "none";
  document.getElementById("Toast_EmptySubmit").style.display = "none";
  document.getElementById("modalPopUp").style.display = "none";
  document.getElementById("changeLogModal").style.display = "none";
  document.getElementById("advancedSettingsForm").style.display = "none";
  document.getElementById("AdvancedSettings_Tax").style.display = "none";

  //*  --- Form Handling ---
  const cropForm = document.getElementById("crop-form");
  cropForm?.addEventListener("submit", handleMultipleFieldFormSubmit);

  const singleFieldSubmitBtn = document.getElementById("crop-submit");
  singleFieldSubmitBtn?.addEventListener("click", handleSingleFieldFormSubmit);

  //* --- ADVANCED SETTINGS ---
  const farmSubmitBUtton = document.getElementById("AS_Farm_Button");
  farmSubmitBUtton?.addEventListener("click", handleFarmSettingsSubmit);
  // Mutual-exclusion and convenience listeners for farmer skills
  const agricCheckbox = document.getElementById("AS_Agriculturist");
  const artisanCheckbox = document.getElementById("AS_Artisan");
  const tillerCheckbox = document.getElementById("AS_Tiller");

  if (agricCheckbox && artisanCheckbox) {
    agricCheckbox.addEventListener("change", () => {
      if (agricCheckbox.checked && artisanCheckbox.checked) {
        // enforce mutual exclusion: uncheck artisan if agric selected
        artisanCheckbox.checked = false;
      }
    });

    artisanCheckbox.addEventListener("change", () => {
      if (artisanCheckbox.checked && agricCheckbox.checked) {
        // enforce mutual exclusion: uncheck agric if artisan selected
        agricCheckbox.checked = false;
      }
    });
  }

  // * --- Modal & List Handling ---
  const listButton = document.getElementById("list-button");
  listButton?.addEventListener("click", showCropsModal);

  document
    .getElementById("modalPopDown")
    ?.addEventListener("click", modalPopDown);
  document
    .getElementById("modalClose")
    ?.addEventListener("click", modalPopDown);
  document
    .getElementById("tableContent-cancel")
    ?.addEventListener("click", modalPopDown);

  // * --- Edit/Delete in Modal ---
  document
    .getElementById("tableContent-edit")
    ?.addEventListener("click", handleEditClick);
  document
    .getElementById("tableContent-delete")
    ?.addEventListener("click", handleDeleteClick);

  // * --- Search ---
  document
    .getElementById("list-search")
    ?.addEventListener("input", handleSearch);

  // * --- Refresh Graph ---
  document
    .getElementById("Chart_RefreshGraph")
    ?.addEventListener("click", handleRefreshGraph);

  // * --- Advanced Settings Toggle ---
  const advancedSettingsBtn = document.getElementById("advancedSettingsButton");
  const advancedSettingsForm = document.getElementById("advancedSettingsForm");

  advancedSettingsBtn?.addEventListener("click", () =>
    toggleVisibility(advancedSettingsForm, advancedSettingsBtn)
  );

  // * --- Single/Multiple Field Toggle ---
  const buttonField = document.getElementById("buttonField");
  buttonField?.addEventListener("click", () => toggleInputForm(buttonField));

  // * --- Change Log Modal ---
  const changeLogButton = document.getElementById("changeLogButton");
  const changeLogModal = document.getElementById("changeLogModal");
  changeLogButton?.addEventListener("click", () =>
    toggleVisibility(changeLogModal, changeLogButton)
  );

  // * --- Paste Button ---
  document
    .getElementById("paste-submit")
    ?.addEventListener("click", handlePasteClick);

  // * --- Allow Regrowth Toggle ---
  document
    .getElementById("crop-regrowth")
    ?.addEventListener("change", handleRegrowthToggle);

  // * --- Advanced Settings Buttons Toggle ---
  const AdvancedSettings_FarmButton = document.getElementById(
    "AdvancedSettings_FarmButton"
  );
  const AdvancedSettings_TaxButton = document.getElementById(
    "AdvancedSettings_TaxButton"
  );
  const AdvancedSettings_Farm = document.getElementById(
    "AdvancedSettings_Farm"
  );
  const AdvancedSettings_Tax = document.getElementById("AdvancedSettings_Tax");

  // helper to toggle active/inactive classes for the advanced settings buttons
  function setAdvancedActive(btn) {
    const container = document.querySelector(".AdvancedSettings_Buttons");
    if (container) {
      container.querySelectorAll("button").forEach((b) => {
        b.classList.remove("active");
        b.classList.add("inactive");
      });
    }
    if (btn) {
      btn.classList.remove("inactive");
      btn.classList.add("active");
    }
  }

  AdvancedSettings_FarmButton?.addEventListener("click", () => {
    toggleVisibility(AdvancedSettings_Farm, AdvancedSettings_FarmButton);
    if (AdvancedSettings_Tax) AdvancedSettings_Tax.style.display = "none";
    setAdvancedActive(AdvancedSettings_FarmButton);
  });

  AdvancedSettings_TaxButton?.addEventListener("click", () => {
    toggleVisibility(AdvancedSettings_Tax, AdvancedSettings_TaxButton);
    if (AdvancedSettings_Farm) AdvancedSettings_Farm.style.display = "none";
    if (AdvancedSettings_Tax) AdvancedSettings_Tax.style.display = "block";
    setAdvancedActive(AdvancedSettings_TaxButton);
  });

  // ensure initial classes (farm active by default)
  if (AdvancedSettings_FarmButton) setAdvancedActive(AdvancedSettings_FarmButton);
}

//* ADVANCED SETTINGS
function handleFarmSettingsSubmit() {
  console.log("Advanced Farm Settings Submitted");

  //optional: validate inputs here if needed
  const currentDayInput = document.getElementById("AS_CurrentDay");
  const durationInput = document.getElementById("AS_Duration");
  if (!durationInput || !currentDayInput) {
    console.error("Duration input field ${!durationInput} or Current Day field ${!currentDayInput} missing.");
    showToast("Configuration error: Duration field missing.", {type: "error", duration: 4000});
    return;
  }

  const durationString = durationInput.value.trim();
  const AS_duration = parseInt(durationString);
  
  const cropsInput = document.getElementById("AS_Crops");
  const farmingLevelInput = document.getElementById("AS_FarmingLevel");
  const fertilizerSelect = document.getElementById("AS_FertilizerType");
  const tillerCheckbox = document.getElementById("AS_Tiller");
  const gathererCheckbox = document.getElementById("AS_Gatherer");
  const botanistCheckbox = document.getElementById("AS_Botanist");
  const agricCheckbox = document.getElementById("AS_Agriculturist");
  const artisanCheckbox = document.getElementById("AS_Artisan");

  const currentDay = currentDayInput ? currentDayInput.value : null;
  const duration = durationInput ? durationInput.value : null;
  const crops = cropsInput ? cropsInput.value : null;
  const farmingLevel = farmingLevelInput ? farmingLevelInput.value : null;

  console.log("Settings - Day:", currentDay, "Duration:", duration, "Crops:", crops, "Farming Level:", farmingLevel);

  // Recalculate all crops based on new duration
  // Enforce skill rules before recalculation:
  // - Agriculturist and Artisan are mutually exclusive (handled on change as well)
  // - If Agriculturist or Artisan is selected, ensure Tiller is applied and Farming Level >= 10
  // - If only Tiller is selected, ensure Farming Level >= 5
  try {
    let farmingLevelVal = Number.parseInt(farmingLevelInput?.value, 10) || 0;
    const agricChecked = agricCheckbox ? agricCheckbox.checked : false;
    const artisanChecked = artisanCheckbox ? artisanCheckbox.checked : false;
    const tillerChecked = tillerCheckbox ? tillerCheckbox.checked : false;

    if (agricChecked || artisanChecked) {
      // Auto-apply tiller
      if (tillerCheckbox) tillerCheckbox.checked = true;
      farmingLevelVal = Math.max(farmingLevelVal, 10);
    } else if (tillerChecked) {
      farmingLevelVal = Math.max(farmingLevelVal, 5);
    }

    // Cap farming level at 10
    farmingLevelVal = Math.min(farmingLevelVal, 10);
    if (farmingLevelInput) farmingLevelInput.value = farmingLevelVal;

    // Use numeric duration if possible
    const durationNumber = Number.isFinite(Number(duration)) ? Number.parseInt(duration, 10) : null;
    recalculateAllCrops(durationNumber || undefined);
  } catch (err) {
    console.error("Error enforcing farm settings rules:", err);
    recalculateAllCrops(duration);
  }

  //update UI
  updateTable();
  updateNoCropsUI();
  updateGraph();

  showToast("Farm settings updated and crops recalculated. Recalculated for ${duration} days.", {  
    type: "success",
    duration: 4000,
  });
}

// ! END OF ATTACH EVENT LISTENERS

// * --- Individual Handler Functions ---
function handleMultipleFieldFormSubmit(event) {
  event.preventDefault();
  const cropNameEl = document.getElementById("crop-name");
  const seedPriceStr = document.getElementById("seed-price")?.value?.trim() ?? "";
  const cropPriceStr = document.getElementById("crop-price")?.value?.trim() ?? "";
  const cropGrowthDaysStr = document.getElementById("crop-growth-days")?.value?.trim() ?? "";
  const cropRegrowth = document.getElementById("crop-regrowth")?.checked ?? false;
  const cropRegrowthEveryStr = document.getElementById("crop-regrowth-every")?.value?.trim() ?? "";

  const cropName = cropNameEl ? cropNameEl.value.trim() : "";

  const seedPrice = Number.parseFloat(seedPriceStr);
  const cropPrice = Number.parseFloat(cropPriceStr);
  const cropGrowthDays = Number.parseInt(cropGrowthDaysStr, 10);
  const cropRegrowthEvery = cropRegrowth ? Number.parseInt(cropRegrowthEveryStr, 10) : 0;

  if (
    !cropName ||
    !Number.isFinite(seedPrice) ||
    !Number.isFinite(cropPrice) ||
    !Number.isFinite(cropGrowthDays) ||
    (cropRegrowth && !Number.isFinite(cropRegrowthEvery))
  ) {
    showToast("Please fill required fields with valid numbers", {
      id: "Toast_EmptySubmit",
      type: "error",
      duration: 4000,
    });
    return;
  }

  addCrop({
    cropName,
    seedPrice,
    cropPrice,
    cropGrowthDays,
    cropRegrowth,
    cropRegrowthEvery: cropRegrowth ? cropRegrowthEvery : 0,
  });

  const ResetForm = document.getElementById("crop-form");
  if (ResetForm) ResetForm.reset();
  const allowRegrowthLive = document.getElementById("allowRegrowthLive");
  if (allowRegrowthLive) allowRegrowthLive.style.display = "none";
}

function initProcessingButtons() {
  const container = document.getElementById("processing-control");
  if (!container) return;
  const buttons = Array.from(container.querySelectorAll(".processing-btn"));

  window.currentProcessing = window.currentProcessing || "raw";

  buttons.forEach((btn) => {
    const type = btn.dataset.type || "raw";
    if (type === window.currentProcessing) {
      btn.classList.add("active");
      btn.classList.remove("processing-btn_inactive");
    } else {
      btn.classList.remove("active");
      btn.classList.add("processing-btn_inactive");
    }

    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.remove("active");
        b.classList.add("processing-btn_inactive");
      });
      btn.classList.add("active");
      btn.classList.remove("processing-btn_inactive");

      window.currentProcessing = type;
      // recalc & refresh graph/table via existing handler
      if (typeof handleRefreshGraph === "function") handleRefreshGraph();
      else if (typeof updateGraph === "function") updateGraph();
    });
  });
}

function handleSingleFieldFormSubmit(e) {
  e.preventDefault();
  const bulkInput = document.getElementById("crop-singleTextField")?.value?.trim() ?? "";
  if (!bulkInput) {
    showToast("Please fill required fields", {
      id: "Toast_EmptySubmit",
      type: "error",
      duration: 4000,
    });
    return;
  }

  const entries = bulkInput
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
  let addedCount = 0;
  let errorCount = 0;

  entries.forEach((entry) => {
    const parts = entry.split(/\s+/).filter((part) => part !== "");
    if (parts.length < 4) {
      console.error("Invalid entry format (too few parts):", entry);
      errorCount++;
      return;
    }

    try {
      const cropName = parts[0].replace(/-/g, " ");
      const seedPriceStr = parts[1];
      const cropPriceStr = parts[2];
      const growthDaysStr = parts[3];

      let regrowth = false;
      let regrowthEveryStr = "0";
      if (parts.length >= 6) {
        const flagIndex = parts.length - 2;
        const valueIndex = parts.length - 1;
        if (parts[flagIndex].toLowerCase() === "yes" || parts[flagIndex].toLowerCase() === "y") {
          regrowth = true;
          regrowthEveryStr = parts[valueIndex];
        } else if (parts[flagIndex].toLowerCase() === "no" || parts[flagIndex].toLowerCase() === "n") {
          regrowth = false;
          regrowthEveryStr = "0";
        } else if (isNumeric(parts[flagIndex])) {
          regrowthEveryStr = parts[flagIndex];
          regrowth = true;
        }
      }

      const seedPrice = Number.parseFloat(seedPriceStr);
      const cropPrice = Number.parseFloat(cropPriceStr);
      const growthDays = Number.parseInt(growthDaysStr, 10);
      const regrowthEvery = regrowth ? Number.parseInt(regrowthEveryStr, 10) : 0;

      if (
        !Number.isFinite(seedPrice) ||
        !Number.isFinite(cropPrice) ||
        !Number.isFinite(growthDays) ||
        (regrowth && !Number.isFinite(regrowthEvery))
      ) {
        console.error("Invalid number in entry:", entry);
        errorCount++;
        return;
      }

      addCrop({
        cropName,
        seedPrice,
        cropPrice,
        cropGrowthDays: growthDays,
        cropRegrowth: regrowth,
        cropRegrowthEvery: regrowthEvery,
      });
      addedCount++;
    } catch (error) {
      console.error("Error processing entry:", entry, error);
      errorCount++;
    }
  });

  if (addedCount > 0) {
    showToast(`Added ${addedCount} crop(s).`, { type: "success", duration: 3000 });
  }
  if (errorCount > 0) {
    showToast(`Failed to add ${errorCount} entry(ies). Check console.`, { type: "error", duration: 5000 });
  }

  const textarea = document.getElementById("crop-singleTextField");
  if (textarea) textarea.value = "";
}

function handleRegrowthToggle() {
  const allowRegrowth = document.getElementById("crop-regrowth");
  const allowRegrowthLive = document.getElementById("allowRegrowthLive");
  allowRegrowthLive.style.display = allowRegrowth.checked ? "block" : "none";
}

function handlePasteClick() {
  const small = this.parentElement.querySelector("small");
  const textarea = document.getElementById("crop-singleTextField");
  const button = this;
  button.disabled = true;
  if (small && textarea) {
    let content = small.textContent.trim().replace(/^\[|\]$/g, "");
    content += "\n"; //creates new line
    textarea.value += content; //adds content to textarea
    textarea.focus(); //focuses on textarea
    button.textContent = "✓";
    button.style.backgroundColor = "#4CAF50";
    setTimeout(() => {
      button.textContent = "▼";
      button.style.backgroundColor = "";
      button.disabled = false;
    }, 100);
  }
}

function handleSearch() {
  const searchQuery = this.value.toLowerCase();
  const rows = document.querySelectorAll("#crop-list-table tbody tr");
  rows.forEach((row) => {
    const cropName = row.cells[0].textContent.toLowerCase();
    row.style.display = cropName.includes(searchQuery) ? "" : "none";
  });
}

function handleRefreshGraph() {
  refreshCropDetailsFromTable();
  updateTable();
  updateNoCropsUI();
  updateGraph();
  showToast("Graph Updated", {
    id: "Toast_GraphUpdated",
    type: "success",
    duration: 4000,
  });
}

function showCropsModal() {
  document.getElementById("modalPopUp").style.display = "block";
  populateModalTable();
}

function modalPopDown() {
  document.getElementById("modalPopUp").style.display = "none";
  document.getElementById("changeLogModal").style.display = "none";
}

function populateModalTable() {
  const originalTableBody = document.querySelector("#crop-list-table tbody");
  const modalTableBody = document.getElementById("modal-crop-table-body");
  if (!modalTableBody) return; // * Check if element exists
  modalTableBody.innerHTML = "";
  const rows = originalTableBody.querySelectorAll("tr");
  rows.forEach((row) => {
    const newRow = row.cloneNode(true);
    newRow.addEventListener("click", function () {
      newRow.classList.toggle("selected");
    });
    modalTableBody.appendChild(newRow);
  });
}

// -* -- Edit Logic ---
async function handleEditClick() {
  const tableContentEdit = document.getElementById("tableContent-edit");
  const isEditing = tableContentEdit.textContent === "Save Edit";
  const modalTableBody = document.getElementById("modal-crop-table-body");
  const rows = modalTableBody.querySelectorAll("tr");

  if (isEditing) {
    // * --- Saving Edits ---
    // * Disable editing for all cells
    rows.forEach((row) =>
      row
        .querySelectorAll("td")
        .forEach((cell) => (cell.contentEditable = "false"))
    );

    // * Collect data from the edited modal table and update main data
    const editedNames = new Set(); // * Track names to find deleted/added crops
    const originalNames = new Set(getCropDetails().map((d) => d.name));

    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      const name = cells[0].textContent.trim();
      editedNames.add(name);

      // * Find the original crop data by name to get other potentially uneditable fields if needed
      const originalCrop = getCropDetails().find((d) => d.name === name);

      // * Get values from the edited table
      const seedPrice = cells[1].textContent.trim();
      const cropPrice = cells[2].textContent.trim();
      const growthDays = cells[3].textContent.trim();
      const regrowthText = cells[4].textContent.trim().toLowerCase();
      const regrowth = regrowthText === "yes";
      const regrowthEvery = regrowth ? cells[5].textContent.trim() : "0";

      if (
        !isNumeric(seedPrice) ||
        !isNumeric(cropPrice) ||
        !isNumeric(growthDays) ||
        (regrowth && !isNumeric(regrowthEvery))
      ) {
        showToast(`Invalid data for crop '${name}'. Edit canceled.`, {
          type: "error",
          duration: 4000,
        });
        // Re-enable editing and return
        rows.forEach((row) =>
          row
            .querySelectorAll("td")
            .forEach((cell) => (cell.contentEditable = "true"))
        );
        tableContentEdit.textContent = "Save Edit";
        return;
      }

      // * Recalculate stats using the updated data
      const newInputData = {
        cropName: name,
        seedPrice,
        cropPrice,
        cropGrowthDays: growthDays,
        cropRegrowth: regrowth,
        cropRegrowthEvery: regrowthEvery,
      };

      // * If the crop existed before, edit it
      if (originalCrop) {
        editCrop(name, newInputData);
      } else {
        // * If it's a new crop added via modal editing (shouldn't happen easily, but just in case)
        addCrop(newInputData);
      }
    }

    // * Update the main table UI based on the updated cropDetails
    updateTable();
    updateNoCropsUI();
    updateGraph();

    tableContentEdit.textContent = "Edit";
    console.log("Edits saved and UI updated!");
  } else {
    // * --- Enable Editing ---
    rows.forEach((row) => {
      row.querySelectorAll("td").forEach((cell) => {
        cell.contentEditable = "true";
      });
    });
    tableContentEdit.textContent = "Save Edit";
  }
}

// *--- Delete Logic ---
function handleDeleteClick() {
  const selectedRows = document.querySelectorAll(
    "#modal-crop-table-body .selected"
  );
  if (selectedRows.length === 0) {
    showToast("Please select at least one crop to delete!", {
      type: "info",
      duration: 3000,
    });
    return;
  }

  const namesToDelete = Array.from(selectedRows).map((row) =>
    row.cells[0].textContent.trim()
  );

  // Delete from data module
  deleteCrops(namesToDelete);

  // Update UI (table and graph are updated by deleteCrops via refreshCropDetailsFromTable)
  updateTable();
  updateNoCropsUI();
  updateGraph();

  // Remove rows from modal view as well
  selectedRows.forEach((row) => row.remove());
  showToast(`Deleted ${namesToDelete.length} crop(s).`, {
    type: "info",
    duration: 3000,
  });
}

// *--- UI Update Functions ---
export function updateTable() {
  if (!cropListTableBody) return; // Check if element exists
  cropListTableBody.innerHTML = "";
  getCropDetails().forEach((stats) => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${stats.name}</td>
      <td>${stats.seedPrice}</td>
      <td>${stats.cropPrice}</td>
      <td>${stats.growthDays}</td>
      <td>${stats.regrowthEvery > 0 ? "Yes" : "No"}</td>
      <td>${stats.regrowthEvery > 0 ? stats.regrowthEvery : "-"}</td>
    `;
    cropListTableBody.appendChild(newRow);
  });
  updateNoCropsUI();
}

export function updateGraph() {
  console.log("updateGraph called"); // Debug log

  // Get the current data from the data module
  const cropDetails = getCropDetails();
  console.log("Retrieved cropDetails:", cropDetails); // Debug log

  // Check if the chart instance exists and destroy it if it does
  if (windowMyChart) {
    console.log("Destroying existing chart instance"); // Debug log
    windowMyChart.destroy();
    windowMyChart = null; // Ensure the variable is cleared
  }

  // Check if there's data to display
  if (!cropDetails || cropDetails.length === 0) {
    console.log(
      "No crop details to display on graph. Clearing canvas if possible."
    );
    // Optionally clear canvas or show a message if no data
    if (ctx && ctx.canvas) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    // Do NOT return here if you want an empty chart or a placeholder
    // Just proceed to create a chart with empty data or minimal data
  } else {
    // Build and sort data for the chart using the data from the module
    console.log("Processing cropDetails for chart..."); // Debug log
    const processingType = window.currentProcessing || "raw";
    const combinedData = cropDetails.map((detail) => {
      let profit = 0;
      if (processingType === "raw") {
        profit = parseFloat(detail.totalProfit) || 0;
      } else {
        // processed products are stored under detail.artisan[productType]
        const prod = detail.artisan && detail.artisan[processingType];
        if (prod && prod.totalProfit !== undefined) {
          profit = parseFloat(prod.totalProfit) || 0;
        } else {
          // fallback to 0 when product not applicable
          profit = 0;
        }
      }
      console.log(
        `Processing crop: ${detail.name}, processing: ${processingType}, profit: ${profit}`
      );
      return {
        label: detail.name,
        value: profit,
        detail, // Include the full detail object for tooltips
      };
    });

    console.log("Combined data before sorting:", combinedData); // Debug log

    combinedData.sort((a, b) => b.value - a.value); // Sort descending by profit
    console.log("Combined data after sorting:", combinedData); // Debug log

    const sortedLabels = combinedData.map((item) => item.label);
    const sortedData = combinedData.map((item) => item.value);
    const sortedDetails = combinedData.map((item) => item.detail);

    console.log("Sorted Labels:", sortedLabels); // Debug log
    console.log("Sorted Data:", sortedData); // Debug log
    console.log("Sorted Details (first few):", sortedDetails.slice(0, 3)); // Debug log (first 3)

    // Check if ctx is available
    if (!ctx) {
      console.error(
        "Canvas context (ctx) is not available. Cannot create chart."
      );
      return; // Stop if context is missing
    }

    console.log("Creating new chart with data..."); // Debug log
    // Create the new chart using the data from the module
    try {
      windowMyChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: sortedLabels,
          datasets: [
            {
              data: sortedData,
              borderWidth: 1,
              backgroundColor: sortedLabels.map(() => "rgb(48, 124, 42)"),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          interaction: {
            intersect: false,
            mode: "nearest",
            axis: "x",
          },
          onHover: (event, chartElements) => {
            // chartElements is an array of active elements
            if (event && event.native && chartElements && chartElements.length) {
              const activeIndex = chartElements[0].index;
              // Highlight hovered bar
              const dataset = windowMyChart.data.datasets[0];
              dataset.backgroundColor = sortedLabels.map((_, index) =>
                index === activeIndex ? "rgb(48, 124, 42)" : "rgba(46, 54, 64, 0.6)"
              );
              windowMyChart.update();

              const crop = sortedDetails[activeIndex];
              if (crop) showDetailsPane(crop);
            } else {
              // Mouse left chart area
              hideDetailsPane();
              // Reset bar colors
              const dataset = windowMyChart.data.datasets[0];
              dataset.backgroundColor = sortedLabels.map(() => "rgb(48, 124, 42)");
              windowMyChart.update();
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });
      console.log("Chart created successfully!"); // Debug log
    } catch (error) {
      console.error("Error creating chart:", error); // Catch potential Chart.js errors
    }

    // Attach tippy events to canvas (if needed, similar to original)
    if (windowMyChart && windowMyChart.canvas && tippyInstance) {
      windowMyChart.canvas.addEventListener("mousemove", (event) => {
        tippyInstance.setProps({
          getReferenceClientRect: () => event.target.getBoundingClientRect(),
        });
        tippyInstance.show();
      });
      windowMyChart.canvas.addEventListener("mouseleave", () => {
        tippyInstance.hide();
      });
    }
  }
}

export function updateNoCropsUI() {
  const cropDetails = getCropDetails();
  const empty = !Array.isArray(cropDetails) || cropDetails.length === 0;
  const noCropsMsg = document.getElementById("no-crops-yet");
  const refreshBtn = document.getElementById("Chart_RefreshGraph");
  const chartNote = document.getElementById("Chart_Note");
  const graphButtonField = document.getElementById("graphButtonField");

  if (noCropsMsg) noCropsMsg.style.display = empty ? "block" : "none";
  if (refreshBtn) refreshBtn.style.display = empty ? "none" : "inline-block";
  if (chartNote) chartNote.style.display = empty ? "none" : "inline-block";
  if (graphButtonField)
    graphButtonField.style.display = empty ? "none" : "block";
}

// --- Helper UI Functions ---
function toggleVisibility(element, button) {
  if (!element) return;
  if (element.style.display === "none" || !element.style.display) {
    element.style.display = "block";
    if (button) button.textContent = button.textContent.replace("▼", "▲");
  } else {
    element.style.display = "none";
    if (button) button.textContent = button.textContent.replace("▲", "▼");
  }
}

function toggleInputForm(button) {
  const isSingleField = button.textContent.includes("↻ Single Field");
  const singleFieldForm = document.getElementById("crop-formField");
  const multipleFieldsForm = document.getElementById("crop-form");

  if (isSingleField) {
    button.textContent = "↻ Multiple Fields";
    if (singleFieldForm) singleFieldForm.style.display = "block";
    if (multipleFieldsForm) multipleFieldsForm.style.display = "none";
  } else {
    button.textContent = "↻ Single Field";
    if (singleFieldForm) singleFieldForm.style.display = "none";
    if (multipleFieldsForm) multipleFieldsForm.style.display = "block";
  }
}

// Render detail HTML used by both the details pane and (optionally) the tooltip
function renderDetailHTML(crop) {
  if (!crop) return "<div>No data</div>";
  const proc = window.currentProcessing || "raw";
  const artisanSection = (() => {
    if (proc === "raw") return "";
    const p = crop.artisan && crop.artisan[proc];
    if (!p) {
      const titleCase = proc.charAt(0).toUpperCase() + proc.slice(1).toLowerCase();
      return `<section class="tippySection"><span class="tippyHeading"> ${titleCase} </span><div>Not applicable for this crop.</div></section>`;
    }
    const titleCase = proc.charAt(0).toUpperCase() + proc.slice(1).toLowerCase();
    return `<section class="tippySection"><span class="tippyHeading"> ${titleCase}</span><div><span> Expected AVG: </span> ${p.expectedValue}g</div><div><span> Adjusted AVG: </span> ${p.adjustedValue}g</div><div><span> Total Revenue: </span> ${p.totalRevenue}g</div><div><span> Total Profit: </span> ${p.totalProfit}g</div></section>`;
  })();

  return `
    <div class="details-content">
      <div style="font-weight: bold; font-size: 140%; color: rgb(12, 126, 16); margin-bottom: 8px;">${crop.name}</div>
      <section class="tippySection">
        <span class="tippyHeading">Harvest Summary</span>
        <div><span>Total Profit:</span> ${crop.totalProfit}g</div>
        <div><span>ROI Percent:</span> ${crop.roiPercent}</div>
        <div><span>Profit Per Day:</span> ${crop.profitPerDay}g</div>
      </section>
      ${artisanSection}
      <section class="tippySection">
        <span class="tippyHeading">Crop Quality & Value</span>
        <div><span>Normal:</span> ${crop.qualityTiers?.normal?.value ?? "-"}g</div>
        <div><span>Silver:</span> ${crop.qualityTiers?.silver?.value ?? "-"}g</div>
        <div><span>Gold:</span> ${crop.qualityTiers?.gold?.value ?? "-"}g</div>
        <div><span>Expected AVG:</span> ${crop.qualityTiers?.expectedValue ?? "-"}g</div>
        <div><span>Adjusted Value:</span> ${crop.qualityTiers?.adjustedValue ?? "-"}g</div>
      </section>
      <section class="tippySection">
        <span class="tippyHeading">Seed & Sell Prices</span>
        <div><span>Seed Cost:</span> ${crop.seedPrice}g</div>
        <div><span>Base Crop Price:</span> ${crop.cropPrice}g</div>
        <div><span>Total Revenue:</span> ${crop.totalRevenue}g</div>
        <div><span>Total Cost:</span> ${crop.totalCost}g</div>
      </section>
      <section class="tippySection">
        <span class="tippyHeading">Growth & Harvest Info</span>
        <div><span>Growth Days:</span> ${crop.growthDays} days</div>
        <div><span>Harvests Per Season:</span> ${crop.harvests}</div>
        <div><span>Break-Even Point:</span> ${crop.breakEvenHarvests ?? "-"} harvests</div>
        <div><span>Regrows Every:</span> ${crop.regrowth || "-"}</div>
      </section>
      ${(crop.description || crop.additionalInfo) ? `<section class="tippySection">${crop.description || crop.additionalInfo}</section>` : ""}
    </div>
  `;
}

function showDetailsPane(crop) {
  try {
    const pane = document.getElementById("details-pane");
    const content = document.getElementById("details-pane-content");
    const title = document.getElementById("details-pane-title");
    if (!pane || !content) return;
    if (title) title.textContent = "Crop Details";
    content.innerHTML = renderDetailHTML(crop);
    pane.classList.add("open");
    if (tippyInstance) tippyInstance.hide();
  } catch (err) {
    console.error("showDetailsPane error:", err);
  }
}

function hideDetailsPane() {
  const pane = document.getElementById("details-pane");
  if (!pane) return;
  pane.classList.remove("open");
}
// * --- Initialization Helper ---
function initializeChart() {
  if (windowMyChart) {
    windowMyChart.destroy();
  }
  // * Create an initial empty chart or a placeholder if desired
  windowMyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: "rgba(0,0,0,0.1)", // * Transparent or placeholder color
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });
}
