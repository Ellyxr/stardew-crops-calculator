/*
TODO:
* Feature
> allow user to export a list and import said list for better ux 
- [ ] add comparison between crops (like, crops vs crops)
- [ ] fix footer, add kofi
- [ ] in the changelog, at the top, add a suggestion box

* Aesthetic:
- [ ] get the time and if its daytime at the user place, change the bg to daytime

*/

import { calculateCropStats as moduleCalculateCropStats } from './calculation.js';

let tippyInstance = null;

/* 
 ! Variables 
 */

/*
 * Advanced Settings visibility
 */
let advancedSettingsForm = document.getElementById("advancedSettingsForm");
document.getElementById("advancedSettingsForm").style.display = "none";

document
  .getElementById("advancedSettingsButton")
  .addEventListener("click", function () {
    if (
      advancedSettingsForm.style.display === "none" ||
      !advancedSettingsForm.style.display
    ) {
      advancedSettingsForm.style.display = "block";
      this.textContent = "Advanced Settings ▲";
    } else {
      advancedSettingsForm.style.display = "none";
      this.textContent = "Advanced Settings ▼";
    }
  });


  /*
 * Press tab to focus on single or multiple field input
 */
document.addEventListener("keydown", function (event) {
  if (event.key !== "Tab") return;
  const multipleFieldsForm = document.getElementById("crop-form");
  const cropNameInput = document.getElementById("crop-name");
  const singleFieldForm = document.getElementById("crop-formField");
  const singleFieldInput = document.getElementById("crop-singleTextField");

  if (
    multipleFieldsForm &&
    multipleFieldsForm.style.display !== "none" &&
    document.activeElement !== cropNameInput &&
    cropNameInput.value.trim() === ""
  ) {
    event.preventDefault();
    cropNameInput.focus();
    return;
  }
  if (
    singleFieldForm &&
    singleFieldForm.style.display !== "none" &&
    document.activeElement !== singleFieldInput &&
    singleFieldInput.value.trim() === ""
  ) {
    event.preventDefault();
    singleFieldInput.focus();
  }
});

/*
 * Crop Fields Form visibility
 */
const buttonField = document.getElementById("buttonField");
document.getElementById("crop-formField").style.display = "none";

buttonField.addEventListener("click", function () {
  const isSingleField = buttonField.textContent.includes("↻ Single Field");

  if (isSingleField) {
    buttonField.textContent = "↻ Multiple Fields";
    document.getElementById("crop-formField").style.display = "block";
    document.getElementById("crop-form").style.display = "none";
  } else {
    buttonField.textContent = "↻ Single Field";
    document.getElementById("crop-formField").style.display = "none";
    document.getElementById("crop-form").style.display = "block";
  }
});

/*
 * change log modal visibility
*/
const changeLogModal = document.getElementById("changeLogModal");
const changeLogButton = document.getElementById("changeLogButton");
document.getElementById("changeLogModal").style.display = "none";

changeLogButton.addEventListener("click", function() {
  if (changeLogModal.style.display === "none") {
  document.getElementById("changeLogModal").style.display = "block";
  } else {
    document.getElementById("changeLogModal").style.display = "none";
  }
});

    /*
 * Edit Modal visibility
 */
function modalPopUp() {
  document.getElementById("modalPopUp").style.display = "block";
  populateModalTable();
}

function modalPopDown() {
  document.getElementById("modalPopUp").style.display = "none";
  document.getElementById("changeLogModal").style.display = "none";
}

document.getElementById("modalPopUp").style.display = "none";
document.getElementById("modalPopDown").addEventListener("click", modalPopDown);
document.getElementById("modalClose").addEventListener("click", modalPopDown);

document
  .getElementById("tableContent-cancel")
  .addEventListener("click", modalPopDown);


function populateModalTable() {
  const originalTableBody = document.querySelector("#crop-list-table tbody");
  const modalTableBody = document.getElementById("modal-crop-table-body");

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

function showCropsModal() {
  modalPopUp();
}

const listButton = document.getElementById("list-button");
listButton.addEventListener("click", showCropsModal);

console.log("Script loaded!");

if (!listButton) {
  console.error("Could not find #list-button element!");
} else {
  console.log("Button found:", listButton);

  listButton.addEventListener("click", function () {
    console.log("I'm clicked!");
    showCropsModal();
  });
}
//delete tr
let changesMade = false;

//New function to get fresh data from the table
function refreshGraphData() {
  const rows = document.querySelectorAll("#crop-list-table tbody tr");
  const newDetails = [];

  rows.forEach((row) => {
    const name = row.cells[0].textContent.trim();
    const seedPrice = row.cells[1].textContent.trim();
    const cropPrice = row.cells[2].textContent.trim();
    const growthDays = row.cells[3].textContent.trim();
    const regrowth = row.cells[4].textContent.trim().toLowerCase() === "yes";
    const regrowthEvery = regrowth ? row.cells[5].textContent.trim() : "0";

    const stats = calculateCropStats({
      cropName: name,
      seedPrice: seedPrice,
      cropPrice: cropPrice,
      cropGrowthDays: growthDays,
      cropRegrowth: regrowth,
      cropRegrowthEvery: regrowthEvery,
    });

    newDetails.push(stats);
  });

  cropDetails = newDetails;
  cropLabels = cropDetails.map((d) => d.name);
  cropData = cropDetails.map((d) => parseFloat(d.totalProfit) || 0);
}

function deleteHandler() {
  const selectedRows = document.querySelectorAll(
    "#modal-crop-table-body .selected"
  );

  if (selectedRows.length === 0) {
    alert("Please select at least one crop to delete!");
    return;
  }

  selectedRows.forEach((modalRow) => {
    const name = modalRow.cells[0].textContent.trim();
    const seedPriceStr = modalRow.cells[1].textContent.trim();
    const cropPriceStr = modalRow.cells[2].textContent.trim();

    // remove the row from the modal
    modalRow.remove();

    // remove the first matching row from the main table
    const originalRows = Array.from(
      document.querySelectorAll("#crop-list-table tbody tr")
    );
    const origIndex = originalRows.findIndex((r) => {
      const rn = r.cells[0].textContent.trim();
      const rs = r.cells[1].textContent.trim();
      const rp = r.cells[2].textContent.trim();
      return rn === name && rs === seedPriceStr && rp === cropPriceStr;
    });
    if (origIndex !== -1) {
      originalRows[origIndex].remove();
    }

    // remove matching item from cropDetails (first match)
    const cdIndex = cropDetails.findIndex((d) => {
      return (
        String(d.name).trim() === name &&
        String(d.seedPrice).trim() === seedPriceStr &&
        String(d.cropPrice).trim() === cropPriceStr
      );
    });
    if (cdIndex !== -1) {
      cropDetails.splice(cdIndex, 1);
    }
  });

  // rebuild derived arrays and UI from the remaining table/cropDetails
  refreshGraphData();
  updateTable();
  updateNoCropsUI();
  updateGraph();
}

//*Add event listener for the edit button
const tableContentEdit = document.getElementById("tableContent-edit");

tableContentEdit.addEventListener("click", function () {
  const isEditing = tableContentEdit.textContent === "Save Edit";
  const modalTableBody = document.getElementById("modal-crop-table-body");
  const rows = modalTableBody.querySelectorAll("tr");

  if (isEditing) {
    // Disable editing for all cells
    rows.forEach((row) =>
      row.querySelectorAll("td").forEach((cell) => {
        cell.contentEditable = "false"; // Disable editing
      })
    );

    // Clear old arrays
    cropLabels.length = 0;
    cropData.length = 0;
    cropDetails.length = 0;

    // For each row in the modal table
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      // Get values from the edited table
      const name = cells[0].textContent.trim();
      const seedPrice = cells[1].textContent.trim();
      const cropPrice = cells[2].textContent.trim();
      const growthDays = cells[3].textContent.trim();
      const regrowth = cells[4].textContent.trim().toLowerCase() === "yes";
      const regrowthEvery = regrowth ? cells[5].textContent.trim() : 0;

      // Recalculate all stats using your helper function
      const stats = calculateCropStats({
        cropName: name,
        seedPrice: seedPrice,
        cropPrice: cropPrice,
        cropGrowthDays: growthDays,
        cropRegrowth: regrowth,
        cropRegrowthEvery: regrowthEvery,
      });

      // Add to main data arrays
      cropDetails.push(stats); // Main source of truth
    });

    // Update the main table in the UI
    cropListTableBody.innerHTML = ""; // Clear table
    cropDetails.forEach((stats) => {
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

    // Update the graph and tooltips
    updateGraph();

    // Change button text back to "Edit"
    tableContentEdit.textContent = "Edit";
    window.myChart.update();
    console.log("graph updated!");
  } else {
    // Enable editing for all cells
    rows.forEach((row) => {
      row.querySelectorAll("td").forEach((cell) => {
        cell.contentEditable = "true"; // Enable editing
      });
    });

    // Change button text to "Save Edit"
    tableContentEdit.textContent = "Save Edit";
  }
});

const modalDelete = document.getElementById("modalDelete");
const tableContentDelete = document.getElementById("tableContent-delete");

modalDelete.addEventListener("click", deleteHandler);
tableContentDelete.addEventListener("click", deleteHandler);

function saveChanges() {
  if (changesMade) {
    updateGraph();
    populateModalTable();
    changesMade = false;
  }
}

/* 
* TOAST HANDLERS
*/
/*
* Visibility 
*/
document.getElementById("Toast_EmptySubmit").style.display = "none";
document.getElementById("Toast_GraphUpdated").style.display = "none";

/*
* TOAST CONTAINER POSITIONING 
*/
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


// Multiple Fields
document.addEventListener("DOMContentLoaded", function () {
  let allowRegrowth = document.getElementById("crop-regrowth");
  let allowRegrowthLive = document.getElementById("allowRegrowthLive");
  allowRegrowth.addEventListener("change", function () {
    if (this.checked) {
      allowRegrowthLive.style.display = "block";
    } else {
      allowRegrowthLive.style.display = "none";
    }
  });

  //add later for tooltip
  let cropDuration = document.getElementById("crop-duration");
  let cropCustomDuration = document.getElementById("cropCustomDuration");
});

let cropForm = document.getElementById("crop-form");
let cropListTableBody = document.querySelector("#crop-list-table tbody");
let ctx = document.getElementById("crop-canvas").getContext("2d");

let cropDetails = [];
let cropData = [];
let cropLabels = [];

//*helper function for calculation (single and multiple field)
function calculateCropStats(params) {
  // Delegate to centralized calculation module to avoid duplication and keep logic consistent.
  try {
    return moduleCalculateCropStats(params);
  } catch (err) {
    console.error('Error delegating calculateCropStats to module:', err, params);
    return { name: params.cropName || '?', error: 'Calculation failed' };
  }
}


// Always use this to add a crop
function addCrop(stats) {
  cropDetails.push(stats);
  updateTable();
  updateGraph();
}
function findCalcFn() {
  if (typeof window.calculateCropStats === "function") return window.calculateCropStats;
  if (typeof window.calculateCrop === "function") return window.calculateCrop;
  if (typeof window.cropsHandler === "function") return window.cropsHandler;
  if (typeof window.cropsHandler === "object" && typeof window.cropsHandler.calculate === "function") return window.cropsHandler.calculate;
  return null;
}

// Helper: get currently selected crop name from your UI
function getSelectedCropName() {
  // try common selectors - change to your actual selector if different
  const input = document.querySelector("#crop-name-input") || document.querySelector(".crop-name-input") || document.querySelector("input[name='crop']");
  if (input && input.value) return input.value.trim();
  // fallback: look for an element showing the selected crop name
  const sel = document.querySelector(".selected-crop-name") || document.querySelector("#selectedCrop");
  if (sel && sel.textContent) return sel.textContent.trim();
  return null;
}

// Update tooltip fallback (simple). Replace this with your real tooltip updater.
function updateTooltipWithProduct(productKey, productData) {
  // productData expected to include totalProfit, totalRevenue, expectedValue etc.
  const tipEl = document.querySelector(".crop-tooltip") || document.querySelector("#crop-tooltip");
  if (!tipEl) {
    console.log("[tooltip] no tooltip element found for update. product:", productKey, productData);
    return;
  }
  const html = `
    <div><strong>${productKey.toUpperCase()}</strong></div>
    <div>Expected per processed: ${Number(productData.expectedValue || productData.expected || 0).toFixed(2)}</div>
    <div>Total revenue: ${Number(productData.totalRevenue || 0).toFixed(2)}</div>
    <div>Total profit: ${Number(productData.totalProfit || productData.profit || 0).toFixed(2)}</div>
  `;
  tipEl.innerHTML = html;
}

// Update graph fallback - replace with your real graph update function
function updateGraphForProduct(productKey, productData) {
  const graphEl = document.querySelector("#graph") || document.querySelector(".graph");
  if (!graphEl) {
    console.log("[graph] no graph element found. product:", productKey, productData);
    return;
  }
  // simple textual preview so you can confirm it's wired
  graphEl.innerText = `${productKey}: profit ${Number(productData.totalProfit || productData.profit || 0).toFixed(2)}`;
}

// Main handler when user clicks a processing button
async function handleProcessingSelect(type) {
  console.log("[processing] requested:", type);

  const cropName = getSelectedCropName();
  if (!cropName) {
    console.warn("[processing] no selected crop found. Make sure you have an input or selection element that this script can read.");
    return;
  }

  const calcFn = findCalcFn();
  let results = null;

  if (calcFn) {
    try {
      // try calling common signatures
      // prefer synchronous-first, but allow promises
      const res = calcFn.length > 0 ? calcFn(cropName) : calcFn(); // best-effort call
      results = (res && typeof res.then === "function") ? await res : res;
    } catch (err) {
      console.error("[processing] error calling calc function:", err);
    }
  }

  // If no global calc function, try a fallback function if you implemented it:
  if (!results && typeof window.calculateForCropName === "function") {
    try {
      results = window.calculateForCropName(cropName);
    } catch (err) {
      console.error("[processing] fallback calculateForCropName failed:", err);
    }
  }

  // Debug: show what we got
  console.log("[processing] calc results:", results);

  // Expectation: results.artisan is object where keys are product types (wine, juice, jelly, dehydrated)
  const artisan = (results && results.artisan) || results || {};
  // if results is not an object, bail with debug
  if (!artisan || typeof artisan !== "object") {
    console.warn("[processing] artisan results not found or invalid. Inspect 'results' above.");
    return;
  }

  // If user selected 'raw' show raw crop totals (fallback fields)
  if (type === "raw") {
    // prefer results.totalProfit or results.rawProfit etc.
    const rawProfit = (results && (results.totalProfit || results.rawProfit || results.profit)) || 0;
    updateGraphForProduct("raw", { totalProfit: rawProfit });
    updateTooltipWithProduct("raw", { expectedValue: results.cropPrice || results.crop || 0, totalRevenue: results.totalRevenue || 0, totalProfit: rawProfit });
    return;
  }

  // For processing types, find matching key in artisan object
  const prod = artisan[type] || artisan[type.toLowerCase()] || null;

  if (!prod) {
    console.log(`[processing] product '${type}' not available for this crop. artisan keys:`, Object.keys(artisan));
    // show a friendly message in tooltip/graph
    updateTooltipWithProduct(type, { expectedValue: 0, totalRevenue: 0, totalProfit: 0 });
    updateGraphForProduct(type, { totalProfit: 0 });
    return;
  }

  // prod is expected to have fields like .totalProfit, .totalRevenue, .expectedValue
  updateTooltipWithProduct(type, prod);
  updateGraphForProduct(type, prod);
}

// wire UI buttons
function wireProcessingButtons() {
  const container = document.getElementById("processing-control");
  if (!container) {
    console.warn("[processing] #processing-control not found in DOM.");
    return;
  }
  container.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".processing-btn");
    if (!btn) return;
    const type = btn.getAttribute("data-type");
    if (!type) return;
    // visual active state
    container.querySelectorAll(".processing-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    handleProcessingSelect(type);
  });
}

// initialize after DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireProcessingButtons);
} else {
  wireProcessingButtons();
}
// Update table from cropDetails
function updateTable() {
  cropListTableBody.innerHTML = "";
  cropDetails.forEach((stats) => {
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

  const noCropsMsg = document.getElementById("no-crops-yet");
  if (noCropsMsg) {
    noCropsMsg.style.display = cropDetails.length === 0 ? "block" : "none";
  }
  updateNoCropsUI();
}

// Unified handler for both forms
function handleCropSubmission(data) {
  const stats = calculateCropStats(data);
  addCrop(stats);
}

// ...existing code...
function refreshGraph() {
  const refreshBtn =
    document.getElementById("Chart_RefreshGraph") ||
    document.getElementById("Refresh"); // support either id

  refreshBtn.addEventListener("click", function () {
    refreshGraphData();
    updateTable();
    updateNoCropsUI();
    updateGraph();
    showToast("Graph Updated", { id: "Toast_GraphUpdated", type: "success", duration: 4000 });
  });
}
// ensure listener is registered after DOM is ready
document.addEventListener("DOMContentLoaded", refreshGraph);
// ...existing code...

// Multiple field form
cropForm.addEventListener("submit", function (event) {
  event.preventDefault();
  let cropName = document.getElementById("crop-name").value;
  let seedPrice = document.getElementById("seed-price").value;
  let cropPrice = document.getElementById("crop-price").value;
  let cropGrowthDays = document.getElementById("crop-growth-days").value;
  let cropRegrowth = document.getElementById("crop-regrowth").checked;
  let cropRegrowthEvery = document.getElementById("crop-regrowth-every").value;

  if (!cropName || !seedPrice || !cropGrowthDays || !cropPrice) {
    showToast("Please fill required fields", { id: "Toast_EmptySubmit", type: "error", duration: 4000 });

    return;
  }

  handleCropSubmission({
    cropName,
    seedPrice,
    cropPrice,
    cropGrowthDays,
    cropRegrowth,
    cropRegrowthEvery,
  });
  cropForm.reset();
  allowRegrowthLive.style.display = "none";
});
 
// Single field
document.getElementById("crop-submit").addEventListener("click", function (e) {
  e.preventDefault();

  const bulkInput = document
    .getElementById("crop-singleTextField")
    .value.trim();
  if (!bulkInput) {
    showToast("Please fill required fields", { id: "Toast_EmptySubmit", type: "error", duration: 4000 });
    return;
  }

  const entries = bulkInput
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");

  entries.forEach((entry) => {
    const parts = entry.split(/\s+/).filter((part) => part !== "");

    if (parts.length < 5 || parts.length > 6) {
      console.error("Invalid entry format:", entry);
      return;
    }

    try {
      //*[#] indicates order of the parts
      const cropName = parts[0].replace(/-/g, " ");
      const seedPrice = parseFloat(parts[1]);
      const cropPrice =
        parts.length === 6 ? parseInt(parts[2]) : parseInt(parts[5]);
      const growthDays = parseInt(parts[3]);
      const regrowth =
        parts[5].toLowerCase() === "yes" || parts[5].toLowerCase() === "y";
      const regrowthEvery = regrowth ? parseInt(parts[5]) : 0;

      handleCropSubmission({
        cropName,
        seedPrice,
        cropPrice,
        cropGrowthDays: growthDays,
        cropRegrowth: regrowth,
        cropRegrowthEvery: regrowthEvery,
      });
    } catch (error) {
      console.error("Error processing entry:", entry, error);
    }
  });

  document.getElementById("crop-singleTextField").value = "";
});

document.getElementById("paste-submit").addEventListener("click", function () {
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
      button.textContent = "Paste ▼";
      button.style.backgroundColor = "";
      button.disabled = false;
    }, 100);
  }
});

/*
* ARTISAN GOODS | MULTIPLIERS 
*/


/*
* INITIALIZE CHART
*/
function initializeChart() {
  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {});
}

document.addEventListener("DOMContentLoaded", function () {
  initializeChart();
  updateNoCropsUI();
  const singleFieldForm = document.getElementById("crop-formField");
  if (singleFieldForm) {
    singleFieldForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }
});

function updateGraph() {
  if (window.myChart) window.myChart.destroy();

  // Build from cropDetails
  const combinedData = cropDetails.map((detail) => ({
    label: detail.name,
    value: parseFloat(detail.totalProfit),
    detail,
  }));

  combinedData.sort((a, b) => b.value - a.value);

  const sortedLabels = combinedData.map((item) => item.label);
  const sortedData = combinedData.map((item) => item.value);
  const sortedDetails = combinedData.map((item) => item.detail);

  window.myChart = new Chart(ctx, {
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
      onHover: (event, chartElement) => {
        if (event.native && chartElement.length) {
          const dataset = window.myChart.data.datasets[0];
          const activeIndex = chartElement[0].index;

          dataset.backgroundColor = sortedLabels.map((_, index) =>
            index === activeIndex ? "rgb(48, 124, 42)" : "rgba(46, 54, 64, 0.6)"
          );

          window.myChart.update();

          const cropName = sortedLabels[activeIndex];
          const cropValue = sortedData[activeIndex];

          const crop = cropDetails?.find((detail) => detail.name === cropName);

          const tooltipContent = `
            <div style="max-height: 80vh; overflow-y: auto;">
              <div style="font-weight: bold; font-size: 140%; color: rgb(12, 126, 16); margin-bottom: 5px;">
                ${cropName}
              </div>
              <div style="margin-bottom: 5px;" class="tippyBody">

              <section class="tippySection">
              <span class="tippyHeading"> Harvest Summary </span>
                <div> <span> Total Profit: </span> ${crop.totalProfit}g</div>
                <div> <span>ROI Percent: </span> ${crop.roiPercent}</div>
                <div> <span>ProfitPerDay: </span> ${crop.profitPerDay}g</div>
              </section>

              <section class="tippySection">
              <span class="tippyHeading"> Crop Quality & Value </span>
                <div> <span>Normal: </span> ${
                  crop.qualityTiers.normal.value
                }g</div>
                <div> <span>Silver: </span> ${
                  crop.qualityTiers.silver.value
                }g</div>
                <div> <span>Gold: </span> ${crop.qualityTiers.gold.value}g</div>
                <div> <span>Expected AVG: </span> ${
                  crop.qualityTiers.expectedValue
                }g</div>
                <div> <span>Adjusted Value: </span> ${
                  crop.qualityTiers.adjustedValue
                }g</div>
              </section>

              <section class="tippySection">
              <span class="tippyHeading"> Seed & Sell Prices </span>
                <div> <span>Seed Cost: </span> ${crop.seedPrice}g</div>
                <div> <span>Base Crop Price:</span> ${crop.cropPrice}g</div>
                <div> <span>Total Revenue:</span> ${crop.totalRevenue}g</div>
                <div> <span>Total Cost:</span> ${crop.totalCost}g</div>
              </section>

              <section class="tippySection">
              <span class="tippyHeading"> Growth & Harvest Info </span>
                <div> <span> Growth Days:</span> ${crop.growthDays} days</div>
                <div> <span>Harvests Per Season:</span> ${crop.harvests}</div>
                <div> <span>Break-Even Point:</span> ${
                  crop.breakEvenHarvests
                } harvests</div>
                <div> <span>Regrows Every:</span> ${crop.regrowth}</div>
              </section>

                
              </div>
              ${
                crop
                  ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(13, 146, 44, 0.3);">
                  ${crop.description || crop.additionalInfo || ""}
                </div>
              `
                  : ""
              }
            </div>
          `;

          if (!tippyInstance) {
            tippyInstance = tippy(window.myChart.canvas, {
              content: tooltipContent,
              allowHTML: true,
              hideOnClick: true,
              followCursor: true,
              theme: "custom",
              placement: "top",
              offset: [0, 10],
              animation: "fade",
              duration: [200, 50],
              delay: 0,
              popperOptions: {
                modifiers: [
                  {
                    name: "flip",
                    options: {
                      fallbackPlacements: ["top", "bottom", "right", "left"],
                    },
                  },
                  {
                    name: "preventOverflow",
                    options: {
                      padding: 8,
                      boundary: visualViewport,
                    },
                  },
                ],
              },
            });
          } else {
            tippyInstance.setContent(tooltipContent);
          }

          tippyInstance.show();
        } else {
          if (tippyInstance) {
            tippyInstance.hide();
          }

          //Resets all bar colors
          const dataset = window.myChart.data.datasets[0];
          dataset.backgroundColor = sortedLabels.map(() => "rgb(48, 124, 42)");
          window.myChart.update();
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0.0,
          ticks: {
            stepSize: 0,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  });

  if (window.myChart && window.myChart.canvas && typeof tippyInstance !== "undefined" && tippyInstance) {
  window.myChart.canvas.addEventListener("mousemove", (event) => {
    tippyInstance.setProps({
      getReferenceClientRect: () => event.target.getBoundingClientRect(),
    });
    tippyInstance.show();
  });

  window.myChart.canvas.addEventListener("mouseleave", () => {
    tippyInstance.hide();
  });
}
}

// Function to export cropDetails to a JSON file
function exportCrops() {
  if (cropDetails.length === 0) {
    showToast("No crops to export!", { type: "info", duration: 3000 });
    return; // Don't try to export an empty list
  }

  try {
    // Convert the cropDetails array to a JSON string
    const jsonString = JSON.stringify(cropDetails, null, 2); // null for replacer, 2 for indentation (readable format)

    // Create a Blob object representing the JSON data
    const blob = new Blob([jsonString], { type: "application/json" });

    // Generate a filename (e.g., "cropData_20231027.json")
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-'); // Format: YYYY-MM-DDTHH-mm-ss
    const filename = `cropData_${timestamp}.json`;

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); // Create a URL for the blob
    link.download = filename; // Set the desired filename

    // Programmatically click the link to trigger the download
    document.body.appendChild(link); // Add link to the body
    link.click(); // Click the link
    document.body.removeChild(link); // Remove the link from the body

    console.log("Crops exported successfully!");
    showToast("Crops exported successfully!", { type: "success", duration: 3000 });

    // Optional: Update the UI (table, graph) if needed after export (usually not necessary)
    // updateTable();
    // updateGraph();

  } catch (error) {
    console.error("Error exporting crops:", error);
    showToast("Error exporting crops. Check console.", { type: "error", duration: 5000 });
  }
}

// Example: Attach the export function to a button with ID 'export-button'
// Add this button to your HTML if you don't have one
document.addEventListener("DOMContentLoaded", function() {
  const exportButton = document.getElementById("export-button"); // Replace 'export-button' with your actual button ID
  if (exportButton) {
    exportButton.addEventListener("click", exportCrops);
  } else {
    console.warn("Export button with ID 'export-button' not found. Add the button to your HTML.");
  }
});

// Function to import cropDetails from a JSON file
function importCrops(event) {
  const file = event.target.files[0]; // Get the selected file from the input element

  if (!file) {
    console.error("No file selected for import.");
    return;
  }

  // Optional: Validate file type
  if (file.type !== "application/json") {
    showToast("Please select a valid JSON file.", { type: "error", duration: 4000 });
    console.error("Invalid file type selected for import:", file.type);
    // Reset the file input so the user can select again
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      // Get the content of the file (raw text)
      const content = e.target.result;

      // Parse the text as JSON
      const importedData = JSON.parse(content);

      // Validate the imported data structure (optional but recommended)
      if (!Array.isArray(importedData)) {
        throw new Error("Imported data is not an array.");
      }
      // Add more specific validation if needed (e.g., check for required keys in each object)

      // Update the main cropDetails array with the imported data
      cropDetails = importedData;

      // Update the UI (table and graph) to reflect the new data
      updateTable();
      updateNoCropsUI();
      updateGraph(); // This should now use the new cropDetails

      console.log("Crops imported successfully!");
      showToast("Crops imported successfully!", { type: "success", duration: 3000 });

      // Clear the file input after successful import
      event.target.value = "";

    } catch (error) {
      console.error("Error parsing imported JSON:", error);
      showToast("Error parsing imported file. Check console.", { type: "error", duration: 5000 });
      // Clear the file input even if there's an error
      event.target.value = "";
    }
  };

  reader.onerror = function(e) {
    console.error("Error reading file:", e);
    showToast("Error reading file. Check console.", { type: "error", duration: 5000 });
    event.target.value = ""; // Clear the input
  };

  // Start reading the file as text
  reader.readAsText(file);
}

// Example: Attach the import function to a file input element with ID 'import-file-input'
// Add this input to your HTML if you don't have one
document.addEventListener("DOMContentLoaded", function() {
  const importFileInput = document.getElementById("import-file-input"); // Replace 'import-file-input' with your actual input ID
  if (importFileInput) {
    // Use 'change' event for file inputs, not 'click'
    importFileInput.addEventListener("change", importCrops);

    console.log("Import file input listener attached.");
  } else {
    console.warn("Import file input with ID 'import-file-input' not found. Add the input to your HTML.");
  }
});


document.getElementById("list-search").addEventListener("input", function () {
  const searchQuery = this.value.toLowerCase();
  const rows = document.querySelectorAll("#crop-list-table tbody tr");

  rows.forEach((row) => {
    const cropName = row.cells[0].textContent.toLowerCase();
    if (cropName.includes(searchQuery)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});

function updateNoCropsUI() {
  const empty = !Array.isArray(cropDetails) || cropDetails.length === 0;
  const noCropsMsg = document.getElementById("no-crops-yet");
  const refreshBtn = document.getElementById("Chart_RefreshGraph");
  const chartNote = document.getElementById("Chart_Note");

  if (noCropsMsg) noCropsMsg.style.display = empty ? "block" : "none";
  if (refreshBtn) refreshBtn.style.display = empty ? "none" : "inline-block";
  if (chartNote) chartNote.style.display = empty ? "none" : "inline-block";
}
