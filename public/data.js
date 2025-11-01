// data.js - Manages the core crop data array and related operations

import { calculateCropStats } from "./calculation.js";
import { showToast, isNumeric } from "./util.js";
import { updateGraph, updateTable, updateNoCropsUI } from "./ui.js";

let cropDetails = [];
let cropData = [];
let cropLabels = [];

function getCurrentDuration() {
  const durationInput = document.getElementById("AS_Duration");
  const value = durationInput ? durationInput.value : "28";
  const parsedValue = parseInt(value);
  //Validate or provide a default if parsing fails
  return isNaN(parsedValue) || parsedValue <= 0 ? 28 : parsedValue;
}

// --- Getters (if needed elsewhere) ---
export function getCropDetails() {
  return cropDetails;
}
export function getCropData() {
  return cropData;
}
export function getCropLabels() {
  return cropLabels;
}

// --- Setters / Modifiers ---
export function setCropDetails(newDetails) {
  cropDetails = newDetails;
}
export function setCropData(newData) {
  cropData = newData;
}
export function setCropLabels(newLabels) {
  cropLabels = newLabels;
}

/**
 * Adds a new crop to the cropDetails array after calculating its stats.
 * @param {Object} cropInputData - Raw input data for the crop.
 */
export function addCrop(cropInputData) {
  const currentDuration = getCurrentDuration();

  const seedPrice = Number.parseFloat(cropInputData.seedPrice);
  const cropPrice = Number.parseFloat(cropInputData.cropPrice);
  const cropGrowthDays = Number.parseInt(cropInputData.cropGrowthDays, 10);
  const cropRegrowth = !!cropInputData.cropRegrowth;
  const cropRegrowthEvery = cropRegrowth ? Number.parseInt(cropInputData.cropRegrowthEvery, 10) : 0;

  // read farm UI settings for cropsPerTile and fertilizer
  const cropsPerTile = Number.parseInt(document.getElementById("AS_Crops")?.value, 10) || 1;
  const yieldTypeSelect = document.getElementById('crop-yield-type');
  const categorySelect = document.getElementById('crop-category');
  const selectYield = yieldTypeSelect ? yieldTypeSelect.value : 'single';
  const selectCategory = categorySelect ? categorySelect.value : undefined;

  const fertSelect = document.getElementById("AS_FertilizerType");
  const fertilizerType = fertSelect
    ? (fertSelect.multiple ? (fertSelect.selectedOptions[0]?.value || "None") : (fertSelect.value || "None"))
    : "None";
  const farmingLevel = Number.parseInt(document.getElementById("AS_FarmingLevel")?.value, 10) || 1;
  const skills = {
    tiller: !!document.getElementById('AS_Tiller')?.checked,
    agriculturist: !!document.getElementById('AS_Agriculturist')?.checked,
    artisan: !!document.getElementById('AS_Artisan')?.checked,
  };
  const cropYieldType = document.getElementById('crop-yield-type')?.value || 'single';
  const cropCategory = document.getElementById('crop-category')?.value || undefined;

  if (
    !Number.isFinite(seedPrice) ||
    !Number.isFinite(cropPrice) ||
    !Number.isFinite(cropGrowthDays) ||
    (cropRegrowth && !Number.isFinite(cropRegrowthEvery))
  ) {
    showToast("Cannot add crop: invalid numeric inputs", { type: "error", duration: 4000 });
    console.warn("addCrop rejected invalid input:", cropInputData);
    return;
  }

  const stats = calculateCropStats({
    cropName: cropInputData.cropName,
    seedPrice,
    cropPrice,
    cropGrowthDays,
    cropRegrowth,
    cropRegrowthEvery,
    seasonDuration: currentDuration,
    cropsPerTile,
    fertilizerType,
    farmingLevel,
    skills,
    cropYieldType,
    cropCategory,
  });

  if (stats.error) {
    showToast(`Error adding crop: ${stats.error}`, { type: "error", duration: 4000 });
    return;
  }

  // Preserve original input regrowth fields on the stored stats so future
  // recalculations can reference the user's original intent.
  try {
    stats.cropRegrowth = cropRegrowth;
    stats.cropRegrowthEvery = cropRegrowthEvery;
  } catch (e) {
    // defensive: if stats is frozen or non-extensible, skip attaching
    console.warn('Could not attach input regrowth properties to stats object', e);
  }

  cropDetails.push(stats);
  cropLabels = cropDetails.map((d) => d.name);
  cropData = cropDetails.map((d) => parseFloat(d.totalProfit) || 0);

  updateGraph();
  updateNoCropsUI();
  updateTable();
}

/**
 * Updates the cropDetails array based on the current state of the main table UI.
 * Useful after editing or deleting from the modal.
 */
export function refreshCropDetailsFromTable() {
  const currentDuration = getCurrentDuration();

  // read farm UI settings
  const cropsPerTile = Number.parseInt(document.getElementById("AS_Crops")?.value, 10) || 1;
  const fertSelect = document.getElementById("AS_FertilizerType");
  const fertilizerType = fertSelect
    ? (fertSelect.multiple ? (fertSelect.selectedOptions[0]?.value || "None") : (fertSelect.value || "None"))
    : "None";
    const farmingLevel = Number.parseInt(document.getElementById("AS_FarmingLevel")?.value, 10) || 1;
    const skills = {
      tiller: !!document.getElementById('AS_Tiller')?.checked,
      agriculturist: !!document.getElementById('AS_Agriculturist')?.checked,
      artisan: !!document.getElementById('AS_Artisan')?.checked,
    };
    const cropYieldType = document.getElementById('crop-yield-type')?.value || 'single';
    const cropCategory = document.getElementById('crop-category')?.value || undefined;

  const rows = document.querySelectorAll("#crop-list-table tbody tr");
  const newDetails = [];
  rows.forEach((row) => {
    const name = row.cells[0].textContent.trim();
    const seedPrice = row.cells[1].textContent.trim();
    const cropPrice = row.cells[2].textContent.trim();
    const growthDays = row.cells[3].textContent.trim();
    // table column layout: 0=name,1=seed,2=price,3=growth,4=yieldType,5=category,6=regrows,7=every
    const tableYield = row.cells[4] ? row.cells[4].textContent.trim() : '';
    const tableCategory = row.cells[5] ? row.cells[5].textContent.trim() : '';
    const regrowth = row.cells[6] ? row.cells[6].textContent.trim().toLowerCase() === "yes" : false;
    const regrowthEvery = regrowth ? (row.cells[7] ? row.cells[7].textContent.trim() : "0") : "0";

    if (!isNumeric(seedPrice) || !isNumeric(cropPrice) || !isNumeric(growthDays) || (regrowth && !isNumeric(regrowthEvery))) {
        console.warn("Skipping recalculation for crop due to invalid data in table row:", name, { seedPrice, cropPrice, growthDays, regrowth, regrowthEvery });
        return;
    }

    // Map single-letter codes to canonical values if necessary
    const normalizedYield = (tableYield || '').toLowerCase();
    let yieldTypeToUse = normalizedYield;
    if (['a','b','c'].includes(normalizedYield)) {
      yieldTypeToUse = normalizedYield === 'a' ? 'single' : (normalizedYield === 'b' ? 'random_multi' : 'fixed_multi');
    }
    const categoryToUse = (tableCategory || '').toLowerCase() === 'f' ? 'fruit' : (tableCategory || '') || undefined;

    const stats = calculateCropStats({
      cropName: name,
      seedPrice: seedPrice,
      cropPrice: cropPrice,
      cropGrowthDays: growthDays,
      cropRegrowth: regrowth,
      cropRegrowthEvery: regrowthEvery,
      seasonDuration: currentDuration,
      cropsPerTile,
      fertilizerType,
      farmingLevel,
      skills,
      cropYieldType: yieldTypeToUse || document.getElementById('crop-yield-type')?.value || 'single',
      cropCategory: categoryToUse || document.getElementById('crop-category')?.value || undefined,
    });
    newDetails.push(stats);
  });
  cropDetails = newDetails;
  cropLabels = cropDetails.map((d) => d.name);
  cropData = cropDetails.map((d) => parseFloat(d.totalProfit) || 0);
}

/**
 * * DELETES crops from cropDetails based on names.
 * @param {Array<string>} namesToDelete - Array of crop names to delete.
 */
export function deleteCrops(namesToDelete) {
  cropDetails = cropDetails.filter(
    (detail) => !namesToDelete.includes(detail.name)
  );
  // Update derived arrays after deletion
  cropLabels = cropDetails.map((d) => d.name);
  cropData = cropDetails.map((d) => parseFloat(d.totalProfit) || 0);
}

/**
 * * EDITS a crop in cropDetails by recalculating its stats.
 * @param {string} oldName - The name of the crop to edit.
 * @param {Object} newInputData - The new raw input data for the crop.
 */
export function editCrop(oldName, newInputData) {
  const currentDuration = getCurrentDuration(); //Advanced Settings FARM
  const index = cropDetails.findIndex((detail) => detail.name === oldName);
  if (index !== -1) {
    if (!isNumeric(newInputData.seedPrice) || !isNumeric(newInputData.cropPrice) || !isNumeric(newInputData.cropGrowthDays) || (newInputData.cropRegrowth && !isNumeric(newInputData.cropRegrowthEvery))) {
        console.error("Invalid input data provided for editing crop:", oldName, newInputData);
        showToast(`Error: Invalid data for crop '${oldName}'. Edit canceled.`, { type: "error", duration: 4000 });
        return; // Don't update if calculation failed
    }

    const farmingLevel = Number.parseInt(document.getElementById("AS_FarmingLevel")?.value, 10) || 1;
    const skills = {
      tiller: !!document.getElementById('AS_Tiller')?.checked,
      agriculturist: !!document.getElementById('AS_Agriculturist')?.checked,
      artisan: !!document.getElementById('AS_Artisan')?.checked,
    };
    const cropYieldType = document.getElementById('crop-yield-type')?.value || 'single';
    const cropCategory = document.getElementById('crop-category')?.value || undefined;
  const newStats = calculateCropStats({ ...newInputData, seasonDuration: currentDuration, farmingLevel, skills, cropYieldType, cropCategory }); //Advanced Settings FARM
    if (newStats.error) {
      showToast(`Error editing crop: ${newStats.error}`, {
        type: "error",
        duration: 4000,
      });
      return; // Don't update if calculation failed
    }
    cropDetails[index] = newStats;
    // Update derived arrays after edit
    cropLabels = cropDetails.map((d) => d.name);
    cropData = cropDetails.map((d) => parseFloat(d.totalProfit) || 0);
  }
}

export function recalculateAllCrops(newDuration) {
  const durationToUse = newDuration !== undefined ? newDuration : getCurrentDuration();
  console.log("Recalculating all crops with season duration:", durationToUse);

  // farm UI settings
  const cropsPerTile = Number.parseInt(document.getElementById("AS_Crops")?.value, 10) || 1;
  const fertSelect = document.getElementById("AS_FertilizerType");
  const fertilizerType = fertSelect
    ? (fertSelect.multiple ? (fertSelect.selectedOptions[0]?.value || "None") : (fertSelect.value || "None"))
    : "None";
  const farmingLevel = Number.parseInt(document.getElementById("AS_FarmingLevel")?.value, 10) || 1;
  const skills = {
    tiller: !!document.getElementById('AS_Tiller')?.checked,
    agriculturist: !!document.getElementById('AS_Agriculturist')?.checked,
    artisan: !!document.getElementById('AS_Artisan')?.checked,
  };

  const validCropDetails = cropDetails.filter(crop => !crop.error);

  const recalculated = [];
  for (const crop of validCropDetails) {
    const seedPrice = Number.parseFloat(crop.seedPrice);
    const cropPrice = Number.parseFloat(crop.cropPrice);
    const cropGrowthDays = Number.parseInt(crop.growthDays, 10);
    // Determine regrowth robustly: crop objects may come from input shapes or from
    // calculateCropStats() output. Check multiple possible fields.
    const inferredRegrowthFromString = (val) => {
      if (!val && val !== 0) return false;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '--' || trimmed === '' || trimmed === '0') return false;
        // if string contains digits (e.g. " 4 Days"), treat as regrowth
        return /\d+/.test(trimmed);
      }
      return Boolean(val);
    };

    const cropRegrowth = (
      typeof crop.cropRegrowth === 'boolean' ? crop.cropRegrowth :
      inferredRegrowthFromString(crop.regrowth) || Number(crop.regrowthEvery || crop.regrowthEverySpecified || 0) > 0
    );

    const cropRegrowthEvery = cropRegrowth
      ? Number.parseInt(crop.regrowthEvery ?? crop.regrowthEverySpecified ?? (typeof crop.regrowth === 'string' ? (crop.regrowth.match(/\d+/) || [0])[0] : 0), 10) || 0
      : 0;

    if (
      !Number.isFinite(seedPrice) ||
      !Number.isFinite(cropPrice) ||
      !Number.isFinite(cropGrowthDays) ||
      (cropRegrowth && !Number.isFinite(cropRegrowthEvery))
    ) {
      console.warn("Skipping recalculation for crop due to invalid stored data:", crop.name, crop);
      continue;
    }

    const newStats = calculateCropStats({
      cropName: crop.name,
      seedPrice,
      cropPrice,
      cropGrowthDays,
      cropRegrowth,
      cropRegrowthEvery,
      seasonDuration: durationToUse,
      cropsPerTile,
      fertilizerType,
      farmingLevel,
      skills,
      cropYieldType,
      cropCategory,
    });

    if (!newStats.error) recalculated.push(newStats);
    else console.warn("Recalculation returned error for", crop.name, newStats.error);
  }

  cropDetails = recalculated;
  cropLabels = cropDetails.map((d) => d.name);
  cropData = cropDetails.map((d) => parseFloat(d.totalProfit) || 0);

  console.log("Recalculation complete. Updated crop details:", cropDetails);
}
