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

function modalPopUp() {
  document.getElementById("modalPopUp").style.display = "block";
  populateModalTable();
}

function modalPopDown() {
  document.getElementById("modalPopUp").style.display = "none";
}

document.getElementById("modalPopUp").style.display = "none";
document.getElementById("modalPopDown").addEventListener("click", modalPopDown);

document.getElementById("tableContent-cancel").addEventListener("click", modalPopDown);

function populateModalTable() {
  const originalTableBody = document.querySelector("#crop-list-table tbody");
  const modalTableBody = document.getElementById("modal-crop-table-body");

  modalTableBody.innerHTML = "";

  const rows = originalTableBody.querySelectorAll("tr");
  rows.forEach(row => {
    const newRow = row.cloneNode(true);

    newRow.addEventListener("click", function() {
      newRow.classList.toggle("selected");
    });
    
    modalTableBody.appendChild(newRow);
  });
}

function showCropsModal() {
  modalPopUp();
}

const listButton = document.getElementById("list-button");
//const saveChanges = document.getElementById("tableContent-Save");

listButton.addEventListener("click", showCropsModal);



//delete tr
let changesMade = false;

// New function to get fresh data from the table
function refreshGraphData() {
  const rows = document.querySelectorAll("#crop-list-table tbody tr");
  cropLabels = [];
  cropData = [];
  cropDetails = []; 

  // Repopulate from current table state
  rows.forEach(row => {
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
  const selectedRows = document.querySelectorAll("#modal-crop-table-body .selected");
  
  if (selectedRows.length > 0) {

    selectedRows.forEach(modalRow => {
      const cropName = modalRow.cells[0].textContent;
      const cropValue = parseFloat(modalRow.cells[1].textContent);
      
      modalRow.remove();
      
      const originalRows = document.querySelectorAll("#crop-list-table tbody tr");
      originalRows.forEach(originalRow => {
        if (originalRow.cells[0].textContent === cropName && 
            parseFloat(originalRow.cells[1].textContent) === cropValue) {
          originalRow.remove();
        }
      });
    });


    refreshGraphData();
    

    updateGraph();
  } else {
    alert("Please select at least one crop to delete!");
  }
};

//Add event listener for the edit button
const tableContentEdit = document.getElementById("tableContent-edit");

tableContentEdit.addEventListener("click", function() {
  const isEditing = tableContentEdit.textContent === "Save Edit";
  const modalTableBody = document.getElementById("modal-crop-table-body");
  const rows = modalTableBody.querySelectorAll("tr");

  if (isEditing) {
    //disable editing on all cells
    rows.forEach(row => {
      row.querySelectorAll("td").forEach(cell => {
        cell.contentEditable = "false";
      });
    });
  
    // clear and repopulate data arrays
    cropLabels.length = 0;
    cropData.length = 0;
    cropDetails.length = 0;
  
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const name = cells[0].textContent.trim();
      const seedPrice = parseFloat(cells[1].textContent.trim());
      const cropPrice = parseFloat(cells[2].textContent.trim());
      const growthDays = parseInt(cells[3].textContent.trim());
      const regrowth = cells[4].textContent.trim().toLowerCase() === "yes";
      const regrowthEvery = regrowth ? parseInt(cells[5].textContent.trim()) : 0;
  
      const seasonDuration = 28;
      let harvests = 1;
  
      if (regrowth && regrowthEvery > 0) {
        const remainingDays = seasonDuration - growthDays;
        harvests += Math.floor(remainingDays / regrowthEvery);
      }
  
      const profitPerHarvest = cropPrice - seedPrice;
      const normalTotalProfit = profitPerHarvest * harvests;
      const profitPerSeed = normalTotalProfit;
      const roi = (profitPerSeed / seedPrice) * 100;
      const totalGrowthTime = regrowth ? 28 : growthDays;
      const profitPerDay = normalTotalProfit / totalGrowthTime;
  
      cropLabels.push(name);
      cropData.push(profitPerSeed);
  
      cropDetails.push({
        name: name,
        quantity: cropPrice,
        profitPerSeed: roi,
        duration: growthDays,
        harvests: harvests,
        regrowth: regrowth ? `Yes (every ${regrowthEvery} days)` : "No",
        normalTotalProfit: normalTotalProfit,
        profitPerDay: profitPerDay,
      });
    });
  
    // Update the graph and switch button text
    updateGraph();
    tableContentEdit.textContent = "Edit";
  } else {
    //Enable editing
    rows.forEach(row => {
      row.querySelectorAll("td").forEach(cell => {
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
};

function toastPopUp() {
  let toastPopUp = document.getElementById("Toast");
  toastPopUp.className = "show";
  setTimeout(function () {
    toastPopUp.className = toastPopUp.className.replace("show", "");
  }, 3000);
}

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



function updateGraph() {
  if (window.myChart) {
    window.myChart.destroy();
  }

  // Use the current state of cropLabels and cropData
  const combinedData = cropLabels.map((label, index) => ({
    label: label,
    value: cropData[index]
  }));

  combinedData.sort((a, b) => b.value - a.value);

  const sortedLabels = combinedData.map(item => item.label);
  const sortedData = combinedData.map(item => item.value);

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sortedLabels,
      datasets: [
        {
          label: "Total Profit",
          data: sortedData,
          borderColor: "rgb(57, 120, 65)",
          borderWidth: 1,
          backgroundColor: ["rgb(48, 124, 42)"]
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          min: 0.0,
          ticks: {
            stepSize: 0
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              return `${label}: G$${context.raw.toFixed(2)}`;
            },
            afterLabel: function (context) {
              const crop = cropDetails.find((c) => c.name === context.label);
              if (!crop) return "";

              return [
                `Sell Price: ${crop.quantity}`,
                `Profit Per Seed: ${crop.profitPerSeed}`,
                `Duration: ${crop.duration} days`,
                `Harvests: ${crop.harvests}`,
                `Regrowth: ${crop.regrowth}`,
                `Total Profit: G$${crop.normalTotalProfit.toFixed(2)}`,
                `Profit/Day: G$${crop.profitPerDay.toFixed(2)}`
              ].join("\n");
            }
          }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  
  const Refresh = document.getElementById("Refresh");
  if (Refresh) {
    console.log("refreshing..")
    Refresh.addEventListener("click", updateGraph);
  } else {
    console.warn("Refresh button not found in DOM.");
  }

});


