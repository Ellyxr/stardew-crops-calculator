// calculations.js - Functions related to crop calculations

import { GAME_CONSTANTS, cropsDB as CONFIG_CROPS_DB } from './config.js';
import { findCropInDBByName, guessCategory, expectedFromQuality } from './util.js';
// Non-destructive integration: import helper stubs to compute parallel values for
// verification before fully switching logic. These helpers live in calculation_helpers.js
import * as CH from './calculation_helpers.js';

/**
 * calculateCropStats
 * Returns a stats object for a crop. Implements quality probability logic based on farming level,
 * fertilizer level, and skills (tiller/agriculturist/artisan). Multi-yield crops: fertilizer affects only first unit.
 */
export function calculateCropStats({
  cropName,
  seedPrice,
  cropPrice,
  cropGrowthDays,
  cropRegrowth,
  cropRegrowthEvery,
  seasonDuration = 28,
  cropsPerTile = 1,
  fertilizerType = 'None',
  farmingLevel = 1,
  skills = { tiller: false, agriculturist: false, artisan: false },
  cropYieldType = 'single',
  cropCategory = undefined,
}) {
  // parse and validate
  const Seed_Price = Number.parseFloat(seedPrice);
  const originalGrowthDays = Number.parseInt(cropGrowthDays, 10);
  const regrowthEveryRaw = Number.parseInt(cropRegrowthEvery || 0, 10) || 0;
  const Crop_Price = Number.parseFloat(cropPrice);
  const duration = Number.parseInt(seasonDuration, 10) || GAME_CONSTANTS.SEASON_LENGTH || 28;
  const cropsMultiplier = Math.max(1, Number.parseInt(cropsPerTile, 10) || 1);
  // cap farming level at 10 per wiki/testing
  const level = Math.min(10, Math.max(1, Number.parseInt(farmingLevel, 10) || 1));

  // Ensure a profession is active at level 10: if none selected, default to Agriculturist
  if (level >= 10) {
    if (!skills || (!skills.agriculturist && !skills.artisan)) {
      skills = { ...skills, agriculturist: true };
    }
  }

  if (!Number.isFinite(Seed_Price) || !Number.isFinite(Crop_Price) || !Number.isFinite(originalGrowthDays)) {
    return { name: cropName || '?', error: 'Invalid numeric inputs' };
  }

  // fertilizer mapping (levels used in probability formula)
  const FERTILIZER_LEVELS = {
    None: 0,
    Basic_Fertilizer: 1,
    Quality_Fertilizer: 2,
    Deluxe_Fertilizer: 3,
  };
  const fertilizerLevel = FERTILIZER_LEVELS[fertilizerType] ?? 0;

  

  // value multiplier from fertilizer (affects sale price values)
  const QUALITY_FERT_VALUE = {
    None: 1.0,
    Basic_Fertilizer: 1.05,
    Quality_Fertilizer: 1.15,
    Deluxe_Fertilizer: 1.25,
  }[fertilizerType] ?? 1.0;

  // speed-gro effects (optional mapping)
  const SPEEDGRO_REDUCTION = {
    'Speed-Gro': 0.10,
    'Deluxe Speed-Gro': 0.25,
    'Hyper_Speed-Gro': 0.33,
  };
  const speedReduction = SPEEDGRO_REDUCTION[fertilizerType] || 0;

  // effective growth/regrowth with Speed-Gro and Agriculturist
  let effectiveGrowthDays = Math.max(1, Math.ceil(originalGrowthDays * (1 - speedReduction)));
  let effectiveRegrowthEvery = Math.max(0, Math.ceil(regrowthEveryRaw * (1 - speedReduction)));
  if (skills.agriculturist) {
    effectiveGrowthDays = Math.max(1, Math.floor(effectiveGrowthDays * 0.9));
    if (effectiveRegrowthEvery > 0) effectiveRegrowthEvery = Math.max(1, Math.floor(effectiveRegrowthEvery * 0.9));
  }

  // tiller increases base crop price by 10%
  const basePriceAfterTiller = skills.tiller ? Crop_Price * 1.10 : Crop_Price;

  // --- Helper-derived snapshot (non-destructive) ---
  // Compute helper versions of key intermediate values so we can compare and
  // validate behavior without changing the active calculation path. Inserted
  // after dependent variables (e.g. basePriceAfterTiller) are available.
  try {
    const parsedInputs = CH.parseAndValidateInputs({
      seedPrice: Seed_Price,
      cropPrice: Crop_Price,
      cropGrowthDays: originalGrowthDays,
      cropRegrowthEvery: regrowthEveryRaw,
      seasonDuration: duration,
      cropsPerTile: cropsMultiplier,
      farmingLevel: level,
    });

    const helperSpeedReduction = CH.computeSpeedReduction(fertilizerType);
    const helperFertilizerLevel = CH.fertilizerLevelFromType(fertilizerType);
    const helperGrowthMods = CH.applyGrowthModifiers(originalGrowthDays, regrowthEveryRaw, helperSpeedReduction, skills);
    const helperDropRatesWithFert = CH.buildQualityProbabilities(level, helperFertilizerLevel);
    const helperDropRatesNoFert = CH.buildQualityProbabilities(level, 0);
    const helperQualityMultipliers = CH.qualityValueMultipliers();
    const helperExpectedFirst = CH.expectedFromQualityHelper({
      normal: basePriceAfterTiller * (helperQualityMultipliers.normal || 1) * (QUALITY_FERT_VALUE || 1),
    }, helperDropRatesWithFert);

    if (typeof console !== 'undefined' && console.debug) {
      console.debug('calculateCropStats helper-snapshot', {
        parsedInputs,
        helperSpeedReduction,
        helperFertilizerLevel,
        helperGrowthMods,
        helperDropRatesWithFert,
        helperDropRatesNoFert,
        helperQualityMultipliers,
        helperExpectedFirst,
      });
    }
  } catch (e) {
    if (typeof console !== 'undefined' && console.warn) console.warn('calculation helpers snapshot failed', e);
  }

  // helper: build drop rates according to wiki formula and sequential model
  function buildQualityRates(levelForCalc, fertilizerLevelForCalc) {
    // chanceGold = 0.2*(level/10) + 0.2*(fertilizerLevel)*((level+2)/12) + 0.01
    let pGold = 0.2 * (levelForCalc / 10) + 0.2 * (fertilizerLevelForCalc) * ((levelForCalc + 2) / 12) + 0.01;
    pGold = Math.max(0, Math.min(pGold, 0.99));

    // chanceSilver = min(0.75, 2 * chanceGold) (applied after gold fails in sequential model)
    let pSilverParam = Math.min(0.75, 2 * pGold);

    // iridium only possible with Deluxe fertilizer
    let pIridiumParam = fertilizerLevelForCalc >= 3 ? pGold / 2 : 0;

    // sequential allocation: iridium -> gold -> silver -> normal
    let remaining = 1.0;
    const pIridium = Math.min(pIridiumParam, remaining);
    remaining -= pIridium;

    const pGoldFinal = Math.min(pGold, remaining);
    remaining -= pGoldFinal;

    const pSilverFinal = Math.min(pSilverParam, remaining);
    remaining -= pSilverFinal;

    const pNormal = Math.max(0, remaining);
    return { normal: pNormal, silver: pSilverFinal, gold: pGoldFinal, iridium: pIridium };
  }

  const dropRatesWithFert = buildQualityRates(level, fertilizerLevel);
  const dropRatesNoFert = buildQualityRates(level, 0);

  // Quality multipliers
  const qualityMultipliers = { normal: 1.0, silver: 1.25, gold: 1.5, iridium: 2.0 };

  // quality values for first unit (fertilized) and other units
  const qualityValuesFirst = {
    normal: basePriceAfterTiller * QUALITY_FERT_VALUE,
    silver: basePriceAfterTiller * qualityMultipliers.silver * QUALITY_FERT_VALUE,
    gold: basePriceAfterTiller * qualityMultipliers.gold * QUALITY_FERT_VALUE,
    iridium: basePriceAfterTiller * qualityMultipliers.iridium * QUALITY_FERT_VALUE,
  };
  const qualityValuesOther = {
    normal: basePriceAfterTiller,
    silver: basePriceAfterTiller * qualityMultipliers.silver,
    gold: basePriceAfterTiller * qualityMultipliers.gold,
    iridium: basePriceAfterTiller * qualityMultipliers.iridium,
  };

  // expected values (multi-yield: first unit uses fertilizer-improved rates/values)
  const expectedFirst = expectedFromQuality(qualityValuesFirst, dropRatesWithFert);
  const expectedOther = expectedFromQuality(qualityValuesOther, dropRatesNoFert);
  const expectedValuePerHarvest = expectedFirst + (cropsMultiplier > 1 ? (cropsMultiplier - 1) * expectedOther : 0);

  const MALUS = GAME_CONSTANTS?.MALUS ?? 0;
  const adjustedValuePerHarvest = Math.max(0, expectedValuePerHarvest - MALUS);

  // harvests calculation
  let harvests = 0;
  if (cropRegrowth && effectiveRegrowthEvery > 0) {
    const remaining = duration - effectiveGrowthDays;
    if (remaining >= 0) harvests = 1 + Math.floor(remaining / effectiveRegrowthEvery);
    else harvests = 0;
  } else {
    harvests = Math.floor(duration / Math.max(1, effectiveGrowthDays));
  }

  // Ensure harvests is an integer and round up fractional results to avoid decimal harvests in UI
  harvests = Math.max(0, Math.ceil(harvests));

  // number of crops sold (integer)
  const cropsSold = Math.ceil(harvests * cropsMultiplier);

  const totalRevenue = adjustedValuePerHarvest * harvests;
  const totalCost = cropRegrowth ? Seed_Price : Seed_Price * harvests;
  const totalProfit = totalRevenue - totalCost;
  const roi = totalCost !== 0 ? totalProfit / totalCost : 0;
  const profitPerDay = totalProfit / Math.max(1, duration);

  // break-even
  let breakEvenHarvests;
  if (cropRegrowth) breakEvenHarvests = adjustedValuePerHarvest !== 0 ? Seed_Price / adjustedValuePerHarvest : Infinity;
  else {
    const denom = adjustedValuePerHarvest - Seed_Price;
    breakEvenHarvests = denom !== 0 ? Seed_Price / denom : Infinity;
  }

  // artisan goods
  function getArtisanValues(basePrice, category) {
    const price = Number(basePrice) || 0;
    const out = {};
    if (category === 'fruit') {
      out.wine = 3 * price;
      // Dried (dehydrated) uses 5 fruit per dehydrator use. The per-fruit sell price
      // (before artisan profession) is (1.5 * base + 5). Total per-use = per-fruit * 5.
      out.dehydrated = (1.5 * price + 5) * 5;
      out.jelly = 2 * price + 50;
    }
    if (category === 'vegetable') {
      out.juice = 2.25 * price;
      out.jelly = 2 * price + 50;
    }
    if (category === 'mushroom') {
      out.dehydrated = 7.5 * price + 25;
    }
    return out;
  }

  const cropEntry = findCropInDBByName(cropName, CONFIG_CROPS_DB) || null;
  // allow explicit override from UI input
  const category = cropCategory || (cropEntry ? cropEntry.category : guessCategory(cropName));
  const baseForArtisan = basePriceAfterTiller || (cropEntry && cropEntry.basePrice) || 0;
  const artisanBase = getArtisanValues(baseForArtisan, category);

  const totalCostForGoods = cropRegrowth ? Seed_Price : Seed_Price * harvests;
  const artisanProfits = {};
  for (const [productType, baseVal] of Object.entries(artisanBase)) {
    // For dehydrated (dried fruit) we must account for 5 fruits per dehydrator use
    // and the special Artisan formula: per-fruit price = (2.1 * base + 7) when Artisan is active.
    let prodBaseFirst;
    let prodBaseOther;
    if (productType === 'dehydrated') {
      // baseVal returned by getArtisanValues is the per-use total using default per-fruit formula.
      // If Artisan profession is active, compute per-use using the user's provided formula.
      if (skills.artisan) {
        prodBaseFirst = (2.1 * baseForArtisan + 7) * 5 * QUALITY_FERT_VALUE;
        prodBaseOther = (2.1 * baseForArtisan + 7) * 5;
      } else {
        prodBaseFirst = baseVal * QUALITY_FERT_VALUE;
        prodBaseOther = baseVal;
      }
    } else {
      prodBaseFirst = baseVal * (skills.artisan ? 1.04 : 1.0) * QUALITY_FERT_VALUE;
      prodBaseOther = baseVal * (skills.artisan ? 1.04 : 1.0);
    }

    const productQualityValuesFirst = {
      normal: prodBaseFirst,
      silver: prodBaseFirst * qualityMultipliers.silver,
      gold: prodBaseFirst * qualityMultipliers.gold,
      iridium: prodBaseFirst * qualityMultipliers.iridium,
    };
    const productQualityValuesOther = {
      normal: prodBaseOther,
      silver: prodBaseOther * qualityMultipliers.silver,
      gold: prodBaseOther * qualityMultipliers.gold,
      iridium: prodBaseOther * qualityMultipliers.iridium,
    };

    const expectedProductFirst = expectedFromQuality(productQualityValuesFirst, dropRatesWithFert);
    const expectedProductOther = expectedFromQuality(productQualityValuesOther, dropRatesNoFert);
    const expectedProductPerHarvest = expectedProductFirst + (cropsMultiplier > 1 ? (cropsMultiplier - 1) * expectedProductOther : 0);
    const adjustedProductValue = Math.max(0, expectedProductPerHarvest - MALUS);
    const totalRevenueProduct = adjustedProductValue * harvests;
    const totalProfitProduct = totalRevenueProduct - totalCostForGoods;

    // If dehydrated, report how many dehydrated items can be produced from total crops sold
    let dehydratedCount = undefined;
    if (productType === 'dehydrated') {
      const cropsSold = Math.ceil(harvests * cropsMultiplier);
      dehydratedCount = Math.floor(cropsSold / 5);
    }

    artisanProfits[productType] = {
      qualityValuesFirst: productQualityValuesFirst,
      qualityValuesOther: productQualityValuesOther,
      expectedValue: expectedProductPerHarvest.toFixed(2),
      adjustedValue: adjustedProductValue.toFixed(2),
      totalRevenue: totalRevenueProduct.toFixed(2),
      totalProfit: totalProfitProduct.toFixed(2),
      dehydratedCount,
    };
  }

  return {
    name: cropName,
    seedPrice: Seed_Price,
    cropPrice: Crop_Price,
    farmingLevel: level,
    skills: { ...skills },
    dropRatesFirst: dropRatesWithFert,
    dropRatesOther: dropRatesNoFert,
    qualityTiers: {
      // detailed per-first/other breakdown
      normal: { valueFirst: qualityValuesFirst.normal, valueOther: qualityValuesOther.normal, rateFirst: dropRatesWithFert.normal, rateOther: dropRatesNoFert.normal },
      silver: { valueFirst: qualityValuesFirst.silver, valueOther: qualityValuesOther.silver, rateFirst: dropRatesWithFert.silver, rateOther: dropRatesNoFert.silver },
      gold: { valueFirst: qualityValuesFirst.gold, valueOther: qualityValuesOther.gold, rateFirst: dropRatesWithFert.gold, rateOther: dropRatesNoFert.gold },
      iridium: { valueFirst: qualityValuesFirst.iridium, valueOther: qualityValuesOther.iridium, rateFirst: dropRatesWithFert.iridium, rateOther: dropRatesNoFert.iridium },
      expectedValueFirst: expectedFirst.toFixed(2),
      expectedValueOther: expectedOther.toFixed(2),
      expectedValuePerHarvest: expectedValuePerHarvest.toFixed(2),
      adjustedValuePerHarvest: adjustedValuePerHarvest.toFixed(2),
      // Backwards-compatible fields used by existing UI/tooltips
      normalValue: qualityValuesFirst.normal,
      silverValue: qualityValuesFirst.silver,
      goldValue: qualityValuesFirst.gold,
      // Legacy shape: `.normal.value`, `.silver.value`, `.gold.value`
      normal: { value: qualityValuesFirst.normal, rate: dropRatesWithFert.normal },
      silver: { value: qualityValuesFirst.silver, rate: dropRatesWithFert.silver },
      gold: { value: qualityValuesFirst.gold, rate: dropRatesWithFert.gold },
      expectedValue: expectedValuePerHarvest.toFixed(2),
      adjustedValue: adjustedValuePerHarvest.toFixed(2),
    },
    artisan: artisanProfits,
    totalRevenue: totalRevenue.toFixed(2),
    totalCost: totalCost.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    roiPercent: (roi * 100).toFixed(1) + '%',
    profitPerDay: profitPerDay.toFixed(2),
    growthDays: effectiveGrowthDays,
    harvests,
    cropsPerTile: cropsMultiplier,
    fertilizerType,
  cropYieldType,
  cropCategory: category,
    regrowth: cropRegrowth ? ` ${effectiveRegrowthEvery} Days` : '--',
    regrowthEvery: effectiveRegrowthEvery,
    regrowthEverySpecified: regrowthEveryRaw,
    breakEvenHarvests: breakEvenHarvests.toFixed(2),
    goldPerTilePerDay: profitPerDay.toFixed(2),
    calculatedDuration: duration,
    cropsSold,
  };
}