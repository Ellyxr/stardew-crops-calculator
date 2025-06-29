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

      //Store everything for tooltips + table
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
  } else {
    //Enable editing
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

  const Seed_Price = parseFloat(seedPrice);
  const growthDays = parseInt(cropGrowthDays);
  const regrowthEvery = parseInt(cropRegrowthEvery) || 0;
  const Crop_Price = parseInt(cropPrice); 
  const cropQualityValues = {
    normal: Crop_Price, // 120 (example)
    silver: Crop_Price * 1.25, // +25% value (150)
    gold: Crop_Price * 1.5, // +50% value (180)
  };

  const dropRates = {
    normal: 0.97, // 97%
    silver: 0.02, // 2%
    gold: 0.01, // 1%
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

  // Updated Revenue Calculations (Using Adjusted Value)
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

  cropDetails.push({
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
    regrowth: cropRegrowth ? `Yes (every ${regrowthEvery} days)` : "No",
    regrowthEvery: regrowthEvery,
    breakEvenHarvests: breakEvenHarvests.toFixed(2),
    goldPerTilePerDay: profitPerDay.toFixed(2),
  });

  // Update table
  document.getElementById("no-crops-yet").style.display = "none";
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
    <td>${cropName}</td>
    <td>${seedPrice}</td>
    <td>${cropPrice}</td>
    <td>${cropGrowthDays}</td>
    <td>${cropRegrowth ? "Yes" : "No"}</td>
    <td>${cropRegrowth ? cropRegrowthEvery : "-"}</td>
  `;

  cropListTableBody.appendChild(newRow);

  cropLabels.push(cropName);
  cropData.push(totalProfit);

  console.log(cropLabels, cropData);
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
      const growthDays = parseInt(parts[2]);
      const regrowth =
        parts[3].toLowerCase() === "yes" || parts[3].toLowerCase() === "y";
      const regrowthEvery = regrowth ? parseInt(parts[4]) : 0;
      const cropPrice =
        parts.length === 6 ? parseInt(parts[5]) : parseInt(parts[4]);

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

function addCropToTable(data) {
  try {
    const Seed_Price = parseFloat(data.seedPrice);
    const growthDays = parseInt(data.cropGrowthDays);
    const regrowthEvery = parseInt(data.cropRegrowthEvery) || 0;
    const origPrice = parseInt(data.cropPrice);
    const Crop_Price = parseInt(data.cropPrice) * 5; 

    if (isNaN(Seed_Price) || isNaN(growthDays) || isNaN(Crop_Price)) {
      throw new Error("Invalid numeric input");
    }

    const seasonDuration = 28;
    let harvests = 5;

    if (data.cropRegrowth && regrowthEvery > 0) {
      const remainingDays = seasonDuration - growthDays;
      harvests += Math.floor(remainingDays / regrowthEvery);
    }

    const profitPerHarvest = origPrice - Seed_Price;
    const normalTotalProfit = profitPerHarvest * harvests;
    const profitPerSeed = normalTotalProfit;
    const roi = (profitPerSeed / Seed_Price) * 100;
    const totalGrowthTime = data.cropRegrowth ? 28 : growthDays;
    const profitPerDay = normalTotalProfit / totalGrowthTime;

    document.getElementById("no-crops-yet").style.display = "none";
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${data.cropName}</td>
      <td>${Seed_Price.toFixed(2)}</td>
      <td>${Crop_Price}</td>
      <td>${growthDays}</td>
      <td>${data.cropRegrowth ? "Yes" : "No"}</td>
      <td>${data.cropRegrowth ? cropRegrowthEvery : "-"}</td>
    `;
    cropListTableBody.appendChild(newRow);

    cropLabels.push(data.cropName);
    cropData.push(profitPerSeed);

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
          
          const crop = cropDetails?.find(detail => detail.name === cropName);
          
          const tooltipContent = `
            <div style="max-height: 80vh; overflow-y: auto;">
              <div style="font-weight: bold; font-size: 140%; color: rgb(12, 126, 16); margin-bottom: 5px;">
                ${cropName}
              </div>
              <div style="margin-bottom: 5px;" class="tippyBody">
                <div>Total Profit: ${crop.totalProfit}g</div>
                <div>roiPercent: ${crop.roiPercent}</div>
                <div>ProfitPerDay: ${crop.profitPerDay}g</div>

                <div>Normal Value: ${crop.qualityTiers.normal.value}g</div>
                <div>Silver Value: ${crop.qualityTiers.silver.value}g</div>
                <div>Gold Value: ${crop.qualityTiers.gold.value}g</div>
                <div>Expected Valye: ${crop.qualityTiers.expectedValue}g</div>
                <div>Adjusted Value: ${crop.qualityTiers.adjustedValue}g</div>

                <div>Seed Price: ${crop.seedPrice}g</div>
                <div>Crop Price: ${crop.cropPrice}g</div>
                <div>Total Revenue: ${crop.totalRevenue}g</div>
                <div>Total Cost: ${crop.totalCost}g</div>

                <div>Growth Days: ${crop.growthDays} days</div>
                <div>Amt. of Harvests: ${crop.harvests}</div>
                <div>Break Even: ${crop.breakEvenHarvests} harvests</div>
                <div>Profit Per Day: ${crop.goldPerTilePerDay}g</div>
                <div>Regrowth Days: ${crop.regrowth}</div>

                
              </div>
              ${crop ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(13, 146, 44, 0.3);">
                  ${crop.description || crop.additionalInfo || ''}
                </div>
              ` : ''}
            </div>
          `;

          
          if (!tippyInstance) {
            tippyInstance = tippy(window.myChart.canvas, {
              content: tooltipContent,
              allowHTML: true,
              trigger: 'manual',
              hideOnClick: false,
              followCursor: true,
              theme: 'custom',
              placement: 'top',
              offset: [0, 10],
              animation: 'fade',
              duration: [200, 150],
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
          enabled: false, // Completely disable Chart.js tooltips
        },
      },
    },
});

//Handle mouse leave to hide tooltip
window.myChart.canvas.addEventListener('mouseleave', () => {
  if (tippyInstance) {
    tippyInstance.hide();
  }
  
  //Resets bar colors
  const dataset = window.myChart.data.datasets[0];
  dataset.backgroundColor = sortedLabels.map(() => "rgb(48, 124, 42)");
  window.myChart.update();
});
}

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
