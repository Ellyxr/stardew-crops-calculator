/*
TODO:
* Feature
> x make graph highest profit is organized from left to right
> add more tooltips for other qualities and type of produce
> x edit will create a pop up modal that allows the user to freely edit the contents
> x delete will also create a pop up model, preferably in the same modal as delete
> allow user to export a list and import said list for better ux 
> create an array for auto complete feature


* Aesthetic:
> get the time and if its daytime at the user place, change the bg to daytime
> change the bg to gif where the stars are twinkling or a comet comes by or there are birds flying (day)

* Changelog
> add changelogs and kofi for donation
> in the changelog, at the top, add a suggestion box
> in the changelog, add the other todo feature

*/

let tippyInstance = null;

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

function modalPopUp() {
  document.getElementById("modalPopUp").style.display = "block";
  populateModalTable();
}

function modalPopDown() {
  document.getElementById("modalPopUp").style.display = "none";
}

document.getElementById("modalPopUp").style.display = "none";
document.getElementById("modalPopDown").addEventListener("click", modalPopDown);

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
  cropLabels = [];
  cropData = [];
  cropDetails = [];

  //Repopulates from current table state
  rows.forEach((row) => {
    cropLabels.push(row.cells[0].textContent);
    cropData.push(parseFloat(row.cells[1].textContent));

    cropDetails.push({
      name: row.cells[0].textContent,
      quantity: row.cells[2].textContent,
      profitPerSeed: row.cells[3].textContent,
    });
  });
}

// *Updated delete handler
function deleteHandler() {
  const selectedRows = document.querySelectorAll(
    "#modal-crop-table-body .selected"
  );

  if (selectedRows.length > 0) {
    selectedRows.forEach((modalRow) => {
      const cropName = modalRow.cells[0].textContent;
      const cropValue = parseFloat(modalRow.cells[1].textContent);

      modalRow.remove();

      const originalRows = document.querySelectorAll(
        "#crop-list-table tbody tr"
      );
      originalRows.forEach((originalRow) => {
        if (
          originalRow.cells[0].textContent === cropName &&
          parseFloat(originalRow.cells[1].textContent) === cropValue
        ) {
          originalRow.remove();
        }
      });
    });

    refreshGraphData();

    updateGraph();
  } else {
    alert("Please select at least one crop to delete!");
  }
}

//*Add event listener for the edit button
const tableContentEdit = document.getElementById("tableContent-edit");

tableContentEdit.addEventListener("click", function () {
  const isEditing = tableContentEdit.textContent === "Save Edit";
  const modalTableBody = document.getElementById("modal-crop-table-body");
  const rows = modalTableBody.querySelectorAll("tr");

  if (isEditing) {
    rows.forEach((row) =>
      row.querySelectorAll("td").forEach((cell) => {
        cell.contentEditable = "false";
      })
    );

    cropLabels.length = 0;
    cropData.length = 0;
    cropDetails.length = 0;

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      const name = cells[0].textContent.trim();
      const seedPrice = parseFloat(cells[1].textContent.trim());
      const cropPrice = parseFloat(cells[2].textContent.trim());
      const growthDays = parseInt(cells[3].textContent.trim());
      const regrowth = cells[4].textContent.trim().toLowerCase() === "yes";
      const regrowthEvery = regrowth
        ? parseInt(cells[5].textContent.trim())
        : 0;

      //recalculate harvests & profits
      const seasonDuration = 28;
      let harvests = 1;
      if (regrowth && regrowthEvery > 0) {
        harvests += Math.floor((seasonDuration - growthDays) / regrowthEvery);
      }
      const profitPerHarvest = cropPrice - seedPrice;
      const normalTotalProfit = profitPerHarvest * harvests;
      const profitPerSeed = normalTotalProfit;
      const profitPerDay = normalTotalProfit / (regrowth ? 28 : growthDays);

      //Push into graph arrays
      cropLabels.push(name);
      cropData.push(profitPerSeed);

      cropDetails.push({
        name,
        seedPrice,
        cropPrice,
        duration: growthDays,
        harvests,
        regrowth: regrowth ? "Yes" : "No",
        regrowthEvery,
        normalTotalProfit,
        profitPerSeed,
        profitPerDay,
      });
    });

    const cropListTableBody = document.querySelector("#crop-list-table tbody");
    cropListTableBody.innerHTML = ""; // clear

    cropDetails.forEach((detail) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${detail.name}</td>
        <td>${detail.seedPrice}</td>
        <td>${detail.cropPrice}</td>
        <td>${detail.duration}</td>
        <td>${detail.regrowth}</td>
        <td>${detail.regrowthEvery || "-"}</td>
      `;
      cropListTableBody.appendChild(tr);
    });

    updateGraph();
    tableContentEdit.textContent = "Edit";
    window.myChart.update();
    console.log("graph updated!");
  } else {
    rows.forEach((row) => {
      row.querySelectorAll("td").forEach((cell) => {
        cell.contentEditable = "true";
      });
    });

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

function toastPopUp() {
  let toastPopUp = document.getElementById("Toast");
  toastPopUp.className = "show";
  setTimeout(function () {
    toastPopUp.className = toastPopUp.className.replace("show", "");
  }, 3000);
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
function calculateCropStats({
  cropName,
  seedPrice,
  cropPrice,
  cropGrowthDays,
  cropRegrowth,
  cropRegrowthEvery
}) {
  const Seed_Price = parseFloat(seedPrice);
  const growthDays = parseInt(cropGrowthDays);
  const regrowthEvery = parseInt(cropRegrowthEvery) || 0;
  const Crop_Price = parseInt(cropPrice);
  const cropQualityValues = {
    normal: Crop_Price, 
    silver: Crop_Price * 1.25,
    gold: Crop_Price * 1.5,
  };
  const dropRates = {
    normal: 0.97,
    silver: 0.02,
    gold: 0.01,
  };
  const expectedValuePerCrop =
    cropQualityValues.normal * dropRates.normal +
    cropQualityValues.silver * dropRates.silver +
    cropQualityValues.gold * dropRates.gold;
  const malus = 5;
  const adjustedValuePerCrop = expectedValuePerCrop - malus;
  const seasonDuration = 28;
  let harvests = 1;
  if (cropRegrowth && regrowthEvery > 0) {
    const remainingDays = seasonDuration - growthDays;
    harvests += Math.floor(remainingDays / regrowthEvery);
  } else {
    harvests = Math.floor(seasonDuration / growthDays);
  }

  const totalRevenue = adjustedValuePerCrop * harvests;
  const totalCost = cropRegrowth ? Seed_Price : Seed_Price * harvests;
  const totalProfit = totalRevenue - totalCost;
  const roi = totalProfit / totalCost;
  const profitPerDay = totalProfit / seasonDuration;
  let breakEvenHarvests;
  if (cropRegrowth) {
    breakEvenHarvests = Seed_Price / adjustedValuePerCrop;
  } else {
    breakEvenHarvests = Seed_Price / (adjustedValuePerCrop - Seed_Price);
  }
  return {
    name: cropName,
    seedPrice: Seed_Price,
    cropPrice: Crop_Price,
    qualityTiers: {
      normal: { value: cropQualityValues.normal, rate: dropRates.normal },
      silver: { value: cropQualityValues.silver, rate: dropRates.silver },
      gold: { value: cropQualityValues.gold, rate: dropRates.gold },
      expectedValue: expectedValuePerCrop.toFixed(2),
      adjustedValue: adjustedValuePerCrop.toFixed(2),
    },
    totalRevenue: totalRevenue.toFixed(2),
    totalCost: totalCost.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    roiPercent: (roi * 100).toFixed(1) + "%",
    profitPerDay: profitPerDay.toFixed(2),
    growthDays: growthDays,
    harvests: harvests,
    regrowth: cropRegrowth ? ` ${regrowthEvery} Days` : "--",
    regrowthEvery: regrowthEvery,
    breakEvenHarvests: breakEvenHarvests.toFixed(2),
    goldPerTilePerDay: profitPerDay.toFixed(2),
  };
}

cropForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let cropName = document.getElementById("crop-name").value;
  let seedPrice = document.getElementById("seed-price").value;
  let cropPrice = document.getElementById("crop-price").value;
  let cropGrowthDays = document.getElementById("crop-growth-days").value;
  let cropRegrowth = document.getElementById("crop-regrowth").checked;
  let cropRegrowthEvery = document.getElementById("crop-regrowth-every").value;

  if (!cropName || !seedPrice || !cropGrowthDays || !cropPrice) {
    toastPopUp();
    return;
  }

  const stats = calculateCropStats({
    cropName,
    seedPrice,
    cropPrice,
    cropGrowthDays,
    cropRegrowth,
    cropRegrowthEvery
  });

  cropDetails.push(stats);

  // Update table
  document.getElementById("no-crops-yet").style.display = "none";
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${stats.name}</td>
    <td>${stats.seedPrice}</td>
    <td>${stats.cropPrice}</td>
    <td>${stats.growthDays}</td>
    <td>${cropRegrowth ? "Yes" : "No"}</td>
    <td>${cropRegrowth ? stats.regrowthEvery : "-"}</td>
  `;
  cropListTableBody.appendChild(newRow);

  cropLabels.push(stats.name);
  cropData.push(parseFloat(stats.totalProfit));

  updateGraph();
  cropForm.reset();
  allowRegrowthLive.style.display = "none";
});

//single Field
document.getElementById("crop-submit").addEventListener("click", function (e) {
  e.preventDefault();

  console.log("im click");

  const bulkInput = document
    .getElementById("crop-singleTextField")
    .value.trim();
  if (!bulkInput) {
    toastPopUp();
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
      const cropName = parts[0].replace(/-/g, " ");
      const seedPrice = parseFloat(parts[1]);
      const cropPrice =
        parts.length === 6 ? parseInt(parts[5]) : parseInt(parts[4]);
      const growthDays = parseInt(parts[2]);
      const regrowth =
        parts[3].toLowerCase() === "yes" || parts[3].toLowerCase() === "y";
      const regrowthEvery = regrowth ? parseInt(parts[4]) : 0;
      

      addCropToTable({
        cropName,
        seedPrice: seedPrice.toString(),
        cropPrice: cropPrice.toString(),
        cropGrowthDays: growthDays.toString(),
        cropRegrowth: regrowth,
        cropRegrowthEvery: regrowthEvery.toString(),
      });
    } catch (error) {
      console.error("Error processing entry:", entry, error);
    }
  });

  document.getElementById("crop-singleTextField").value = "";
});

document.getElementById('paste-submit').addEventListener('click', function() {
  
  const small = this.parentElement.querySelector('small');
  const textarea = document.getElementById('crop-singleTextField');
  const button = this;
  button.disabled = true;
  
  if (small && textarea) {
    let content = small.textContent.trim().replace(/^\[|\]$/g, '');
    content += '\n'; //creates new line
    textarea.value += content; //adds content to textarea
    textarea.focus(); //focuses on textarea
    
    button.textContent = '✓';
    button.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
      button.textContent = 'Paste ↓';
      button.style.backgroundColor = '';
      button.disabled = false;
    }, 900);
  }
});

function addCropToTable(data) {
  try {
    const stats = calculateCropStats({
      cropName: data.cropName,
      seedPrice: data.seedPrice,
      cropPrice: data.cropPrice,
      cropGrowthDays: data.cropGrowthDays,
      cropRegrowth: data.cropRegrowth,
      cropRegrowthEvery: data.cropRegrowthEvery
    });

    cropDetails.push(stats);

    document.getElementById("no-crops-yet").style.display = "none";
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${stats.name}</td>
      <td>${stats.seedPrice}</td>
      <td>${stats.cropPrice}</td>
      <td>${stats.growthDays}</td>
      <td>${data.cropRegrowth ? "Yes" : "No"}</td>
      <td>${data.cropRegrowth ? stats.regrowthEvery : "-"}</td>
    `;
    cropListTableBody.appendChild(newRow);

    cropLabels.push(stats.name);
    cropData.push(parseFloat(stats.totalProfit));

    updateGraph();
  } catch (error) {
    console.error("Error adding crop to table:", error);
    toastPopUp();
  }
}

function initializeChart() {
  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {});
}

document.addEventListener("DOMContentLoaded", function () {
  initializeChart();
  const singleFieldForm = document.getElementById("crop-formField");
  if (singleFieldForm) {
    singleFieldForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }
});

function updateGraph() {
  if (window.myChart) {
    window.myChart.destroy();
  }

  const combinedData = cropLabels.map((label, index) => ({
    label: label,
    value: cropData[index],
  }));

  combinedData.sort((a, b) => b.value - a.value);

  const sortedLabels = combinedData.map((item) => item.label);
  const sortedData = combinedData.map((item) => item.value);

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
              <span class="tippyHeading"> Crop Quality & value </span>
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

  window.myChart.canvas.addEventListener("mousemove", (event) => {
    tippyInstance.setProps({ getReferenceClientRect: () => event.target.getBoundingClientRect()});
    instance.show();
  });

  window.myChart.canvas.addEventListener("mouseleave", () => {
    tippyInstance.hide();
  })

}

//*wine, juice, jelly, dehydrated
document.addEventListener("DOMContentLoaded", function () {
  const Refresh = document.getElementById("Refresh");
  if (Refresh) {
    console.log("refreshing..");
    Refresh.addEventListener("click", updateGraph);
  } else {
    console.warn("Refresh button not found in DOM.");
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
