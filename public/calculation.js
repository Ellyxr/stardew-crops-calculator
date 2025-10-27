// calculations.js - Functions related to crop calculations

import { GAME_CONSTANTS, cropsDB } from './config.js';
import { findCropInDBByName, guessCategory, expectedFromQuality, isNumeric } from './util.js';

/*
*
 * Calculates statistics for a single crop based on input parameters.
 * @param {Object} params - Object containing crop parameters.
 * @param {string} params.cropName - Name of the crop.
 * @param {string|number} params.seedPrice - Price of the seed.
 * @param {string|number} params.cropPrice - Base price of the crop.
 * @param {string|number} params.cropGrowthDays - Days for initial growth.
 * @param {boolean} params.cropRegrowth - Whether the crop regrows.
 * @param {string|number} params.cropRegrowthEvery - Days between regrowth (if applicable).
 * @param {number} [params.seasonDuration=28] - Duration of the season in days (defaults to 28).
 * @returns {Object} An object containing all calculated statistics.
 */
export function calculateCropStats({
  cropName,
  seedPrice,
  cropPrice,
  cropGrowthDays,
  cropRegrowth,
  cropRegrowthEvery,
  //Advanced Settings FARM
  seasonDuration = 28,
  cropsPerTile = 1,       // new: how many units harvested per harvest (e.g. 3)
  fertilizerType = "None" // new: selected fertilizer type
}) {
  console.log("Input parameters:", { cropName, seedPrice, cropPrice, cropGrowthDays, cropRegrowth, cropRegrowthEvery, seasonDuration, cropsPerTile, fertilizerType });
  // --- Input Validation ---
  const Seed_Price = Number.parseFloat(seedPrice);
  const growthDays = Number.parseInt(cropGrowthDays);
  const regrowthEvery = Number.parseInt(cropRegrowthEvery) || 0;
  const Crop_Price = Number.parseInt(cropPrice);
  const duration = parseInt(seasonDuration);
  const cropsMultiplier = Number.parseInt(cropsPerTile) || 1;

  // fertilizer effects (simple, tunable)
  const FERTILIZER_QUALITY_MULT = {
    "None": 1.0,
    "Basic_Fertilizer": 1.05,
    "Quality_Fertilizer": 1.15,
    "Deluxe_Fertilizer": 1.25,
  };
  const SPEEDGRO_REDUCTION = {
    "Speed-Gro": 0.10,
    "Deluxe Speed-Gro": 0.25,
    "Hyper_Speed-Gro": 0.33,
  };

  const qualityMult = FERTILIZER_QUALITY_MULT[fertilizerType] || 1.0;
  const speedReduction = SPEEDGRO_REDUCTION[fertilizerType] || 0;

  // apply speed-gro to effective growth days
  const effectiveGrowthDays = Math.max(1, Math.ceil(growthDays * (1 - speedReduction)));

  // Check original inputs
  const originalInputsValid = isNumeric(seedPrice) && isNumeric(cropPrice) && isNumeric(cropGrowthDays) && isNumeric(seasonDuration);
  const parsedValuesValid = !isNaN(Seed_Price) && !isNaN(Crop_Price) && !isNaN(growthDays) && !isNaN(duration);
  if (!originalInputsValid || !parsedValuesValid) {
    console.error("Invalid input for calculateCropStats:", { cropName, seedPrice, cropPrice, cropGrowthDays, seasonDuration });
    return { name: cropName, error: "Invalid input data" };
  }

  // --- Core Calculations ---
  const { QUALITY_RATES, MALUS } = GAME_CONSTANTS;
  // apply fertilizer quality multiplier to base values
  const cropQualityValues = {
    normal: Crop_Price * qualityMult,
    silver: Crop_Price * 1.25 * qualityMult,
    gold: Crop_Price * 1.5 * qualityMult,
  };

  const expectedValuePerCrop = expectedFromQuality(cropQualityValues, QUALITY_RATES);
  const adjustedValuePerCrop = expectedValuePerCrop - MALUS;

  let harvests = 1;
  if (cropRegrowth && regrowthEvery > 0) {
    const remainingDays = duration - effectiveGrowthDays;
    if (remainingDays >= 0) {
      harvests += Math.floor(remainingDays / regrowthEvery);
    } else {
      harvests = 0;
    }
  } else {
    harvests = Math.floor(duration / effectiveGrowthDays);
  }

  // multiply revenue by cropsPerTile (multiple units per harvest)
  const totalRevenue = adjustedValuePerCrop * harvests * cropsMultiplier;
  const totalCost = cropRegrowth ? Seed_Price : Seed_Price * harvests;
  const totalProfit = totalRevenue - totalCost;
  const roi = totalCost !== 0 ? totalProfit / totalCost : 0;
  const profitPerDay = totalProfit / duration;

  let breakEvenHarvests;
  if (cropRegrowth) {
    breakEvenHarvests = adjustedValuePerCrop !== 0 ? Seed_Price / adjustedValuePerCrop : Infinity;
  } else {
    const denominator = adjustedValuePerCrop - Seed_Price;
    breakEvenHarvests = denominator !== 0 ? Seed_Price / denominator : Infinity;
  }

  // --- Artisan Goods Calculations ---
  const cropEntry = findCropInDBByName(cropName, cropsDB);
  const category = cropEntry ? cropEntry.category : guessCategory(cropName);

  // Moved helper function inside to keep it local
  function getArtisanValues(basePrice, category) {
    const price = Number(basePrice) || 0;
    const out = {};
    if (category === "fruit") {
      out.wine = 3 * price;
      out.dehydrated = 7.5 * price + 25; // dried fruit
      out.jelly = 2 * price + 50; // preserves/jelly
    }
    if (category === "vegetable") {
      out.juice = 2.25 * price; // keg -> juice
      out.jelly = 2 * price + 50; // optional preserves for vegetables
    }
    if (category === "mushroom") {
      out.dehydrated = 7.5 * price + 25;
      // mushrooms usually don't make wine/juice
    }
    return out;
  }

  const artisanBase = getArtisanValues(Crop_Price || (cropEntry && cropEntry.basePrice) || 0, category);

  // Calculate artisan profits similarly to raw crop
  const totalCostForGoods = cropRegrowth ? Seed_Price : Seed_Price * harvests;
  const artisanProfits = {};
  for (const [productType, baseValue] of Object.entries(artisanBase)) {
     const productQualityValues = {
       normal: baseValue * qualityMult,
       silver: baseValue * 1.25 * qualityMult,
       gold: baseValue * 1.5 * qualityMult,
       iridium: baseValue * 2 * qualityMult,
     };
     const expectedProductValue = expectedFromQuality(productQualityValues, QUALITY_RATES);
     const adjustedProductValue = expectedProductValue - MALUS;
     const totalRevenueProduct = adjustedProductValue * harvests * cropsMultiplier;
     const totalProfitProduct = totalRevenueProduct - totalCostForGoods; // Same cost as raw crop

     artisanProfits[productType] = {
       qualityValues: productQualityValues,
       expectedValue: expectedProductValue.toFixed(2),
       adjustedValue: adjustedProductValue.toFixed(2),
       totalRevenue: totalRevenueProduct.toFixed(2),
       totalProfit: totalProfitProduct.toFixed(2),
     };
  }

  console.log("Calculation successful for:", cropName); // Log successful calculation
  console.groupEnd(); // End debug group

  // --- Return Calculated Data ---
  return {
    name: cropName,
    seedPrice: Seed_Price,
    cropPrice: Crop_Price,
    qualityTiers: {
      normal: { value: cropQualityValues.normal, rate: QUALITY_RATES.normal },
      silver: { value: cropQualityValues.silver, rate: QUALITY_RATES.silver },
      gold: { value: cropQualityValues.gold, rate: QUALITY_RATES.gold },
      expectedValue: expectedValuePerCrop.toFixed(2),
      adjustedValue: adjustedValuePerCrop.toFixed(2),
    },
    artisan: artisanProfits,
    totalRevenue: totalRevenue.toFixed(2),
    totalCost: totalCost.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    roiPercent: (roi * 100).toFixed(1) + "%",
    profitPerDay: profitPerDay.toFixed(2),
    growthDays: effectiveGrowthDays,
    harvests: harvests,
    cropsPerTile: cropsMultiplier,
    fertilizerType,
    regrowth: cropRegrowth ? ` ${regrowthEvery} Days` : "--",
    regrowthEvery: regrowthEvery,
    breakEvenHarvests: breakEvenHarvests.toFixed(2),
    goldPerTilePerDay: profitPerDay.toFixed(2),
    //Advanced Settings FARM
    calculatedDuration: duration,
  };
}

// Example: Helper function to calculate harvests (optional, for further breakdown)
// export function calculateHarvests(growthDays, regrowth, regrowthEvery, seasonLength = GAME_CONSTANTS.SEASON_LENGTH) {
//     let harvests = 1;
//     if (regrowth && regrowthEvery > 0) {
//         const remainingDays = seasonLength - growthDays;
//         if (remainingDays >= 0) {
//             harvests += Math.floor(remainingDays / regrowthEvery);
//         } else {
//             harvests = 0;
//         }
//     } else {
//         harvests = Math.floor(seasonLength / growthDays);
//     }
//     return harvests;
// }