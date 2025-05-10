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

const buttonField = document.getElementById("buttonField");
document.getElementById("crop-formField").style.display = "none";

buttonField.addEventListener("click", function() {
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

// Debug: Check if script is running
console.log("Script loaded!"); // This should appear in console when page loads


// Debug: Check if button exists
if (!listButton) {
  console.error("Could not find #list-button element!");
} else {
  console.log("Button found:", listButton);
  
  listButton.addEventListener("click", function() {
    console.log("I'm clicked!"); // This should appear when clicked
    showCropsModal();
  });
}
//delete tr
let changesMade = false;

// New function to get fresh data from the table
function refreshGraphData() {
  const rows = document.querySelectorAll("#crop-list-table tbody tr");
  cropLabels = [];
  cropData = [];
  cropDetails = [];

  // Repopulate from current table state
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

// Updated delete handler
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

//Add event listener for the edit button
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

      //Push into your graph arrays
      cropLabels.push(name);
      cropData.push(profitPerSeed);

      //Store everything you need for tooltips + table
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

//Multiple Fields
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

  // Convert values
  const Seed_Price = parseFloat(seedPrice);
  const growthDays = parseInt(cropGrowthDays);
  const regrowthEvery = parseInt(cropRegrowthEvery) || 0;
  const Crop_Price = parseInt(cropPrice);

  // Calculations
  const seasonDuration = 28;
  let harvests = 1;

  if (cropRegrowth && regrowthEvery > 0) {
    const remainingDays = seasonDuration - growthDays;
    harvests += Math.floor(remainingDays / regrowthEvery);
  }

  // Fixed profitPerDay calculation
  const profitPerHarvest = Crop_Price - Seed_Price;
  const normalTotalProfit = profitPerHarvest * harvests;

  const profitPerSeed = normalTotalProfit;
  const roi = (profitPerSeed / Seed_Price) * 100;

  const totalGrowthTime = cropRegrowth ? 28 : growthDays;
  const profitPerDay = normalTotalProfit / totalGrowthTime;

  // Store details for tooltip
  cropDetails.push({
    name: cropName,
    quantity: Crop_Price,
    profitPerSeed: roi,
    duration: growthDays,
    harvests: harvests,
    regrowth: cropRegrowth ? `Yes (every ${cropRegrowthEvery} days)` : "No",
    normalTotalProfit: normalTotalProfit,
    profitPerDay: profitPerDay,
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
  cropData.push(profitPerSeed);

  console.log(cropLabels, cropData);
  updateGraph();
  cropForm.reset();
  allowRegrowthLive.style.display = "none";
});


//const saveChanges = document.getElementById("tableContent-Save");


//single Field
document.getElementById("crop-submit").addEventListener("click", function(e) {
  e.preventDefault();

  console.log("im click");
  
  const bulkInput = document.getElementById("crop-singleTextField").value.trim();
  if (!bulkInput) {
    toastPopUp();
    return;
  }

  //Process each entry
  const entries = bulkInput.split(',')
    .map(entry => entry.trim())
    .filter(entry => entry !== "");

  entries.forEach(entry => {
    const parts = entry.split(/\s+/).filter(part => part !== "");
    
    if (parts.length < 5 || parts.length > 6) {
      console.error("Invalid entry format:", entry);
      return;
    }

    try {
      const cropName = parts[0].replace(/-/g, " ");
      const seedPrice = parseFloat(parts[1]);
      const growthDays = parseInt(parts[2]);
      const regrowth = parts[3].toLowerCase() === "yes" || parts[3].toLowerCase() === "y";
      const regrowthEvery = regrowth ? parseInt(parts[4]) : 0;
      const cropPrice = parts.length === 6 ? parseInt(parts[5]) : parseInt(parts[4]);

      addCropToTable({
        cropName,
        seedPrice: seedPrice.toString(),
        cropPrice: cropPrice.toString(),
        cropGrowthDays: growthDays.toString(),
        cropRegrowth: regrowth,
        cropRegrowthEvery: regrowthEvery.toString()
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
    const Crop_Price = parseInt(data.cropPrice) * 5; // Only change this line to multiply by 5
    
    if (isNaN(Seed_Price) || isNaN(growthDays) || isNaN(Crop_Price)) {
      throw new Error("Invalid numeric input");
    }

    // All calculations remain exactly the same as before
    const seasonDuration = 28;
    let harvests = 1;

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

    // Update cropDetails (unchanged from original)
    cropDetails.push({
      name: data.cropName,
      sellPrice: origPrice,
      totalSellPrice: Crop_Price,
      quantity: 5, // Just showing that we're working with 5 crops
      profitPerSeed: roi,
      duration: growthDays,
      harvests: harvests,
      regrowth: data.cropRegrowth ? `Yes (every ${regrowthEvery} days)` : "No",
      regrowthEvery: regrowthEvery,
      normalTotalProfit: normalTotalProfit,
      profitPerDay: profitPerDay,
    });

    document.getElementById("no-crops-yet").style.display = "none";
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${data.cropName}</td>
      <td>${Seed_Price.toFixed(2)}</td>
      <td>${Crop_Price}</td> <!-- This will now show price × 5 -->
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
  
  window.myChart = new Chart(ctx, {
  });
}

document.addEventListener("DOMContentLoaded", function() {
  initializeChart();
  const singleFieldForm = document.getElementById("crop-formField");
  if (singleFieldForm) {
    singleFieldForm.addEventListener("submit", function(e) {
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
          label: "Total Profit",
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
      interaction: {
        intersect: false,
        mode: 'nearest',
        axis: 'x'
      },
      onHover: (event, chartElement) => {
        if (event.native && chartElement.length) {
          const dataset = window.myChart.data.datasets[0];
          const activeIndex = chartElement[0].index;
          
          dataset.backgroundColor = sortedLabels.map((_, index) => 
            index === activeIndex ? "rgb(48, 124, 42)" : "rgba(46, 54, 64, 0.6)"
          );
          
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
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          position: 'nearest',
          backgroundColor: "rgba(197, 214, 221, 0.9)",
          titleColor: "rgb(40, 40, 40)",
          bodyColor: "rgb(57, 57, 57)",
          footerColor: "rgb(57, 57, 57, 0.6)",
          borderColor: "rgba(13, 146, 44, 0.8)",
          borderWidth: 2,
          cornerRadius: 6,
          padding: 12,
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            size: 12,
          },
          footerFont: {
            size: 10,
          },
          caretSize: 8,
          displayColors: false,
          // This makes the tooltip follow the cursor smoothly
          bodyAlign: 'left',
          xAlign: 'center',
          yAlign: 'bottom',
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              const crop = cropDetails.find((c) => c.name === context.label);
              if (!crop) return "";

              return [
                `Profit: G$${context.raw.toFixed(2)}`,
                `Profit/Day: G$${crop.profitPerDay.toFixed(2)}`,
              ];
            },
            afterLabel: function (context) {
              const crop = cropDetails.find((c) => c.name === context.label);
              if (!crop) return "";

              return [
                "--------------------------------",
                `Crop Price: ${crop.sellPrice}`,
                `Profit Per Seed: ${crop.profitPerSeed}`,
                `Growth Days: ${crop.duration} days`,
                `Quantity (Crops): ${crop.quantity}`,
                `Total Sell Price: ${crop.totalSellPrice}`,
                `Regrowth: ${crop.regrowth ? crop.regrowth + " days" : "None"}`,
                `Regrowth: ${crop.regrowth ? "Every " + crop.regrowthEvery + " days" : "None"}`,

                "--------------------------------",
                `Normal Total Profit: G$${crop.normalTotalProfit.toFixed(2)}`,
              ].join("\n");
            },
            footer: function (context) {
              return "Click for more details";
            },
          }
        },
      },
    }
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

document.getElementById("list-search").addEventListener("input", function() {
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
