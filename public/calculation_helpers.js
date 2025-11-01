// calculation_helpers.js
// Non-invasive helper stubs and a sanity-check scanner for formula presence.
// These are lightweight, non-destructive helpers intended to make the main
// `calculateCropStats` easier to reason about. They do not change existing logic.

import { expectedFromQuality } from './util.js';

/*
 Required TODO token: // TODO: STARD EW VALLEY FORMULA CHECK
*/

// parse and normalize inputs
export function parseAndValidateInputs(params = {}) {
  // TODO: STARD EW VALLEY FORMULA CHECK - normalize numbers & clamp farming level to 10
  const parsed = {
    seedPrice: Number.parseFloat(params.seedPrice) || 0,
    cropPrice: Number.parseFloat(params.cropPrice) || 0,
    growthDays: Math.max(1, Number.parseInt(params.cropGrowthDays || 0, 10) || 1),
    regrowEvery: Number.parseInt(params.cropRegrowthEvery || 0, 10) || 0,
    seasonDuration: Number.parseInt(params.seasonDuration || 28, 10) || 28,
    cropsPerTile: Math.max(1, Number.parseInt(params.cropsPerTile || 1, 10) || 1),
    farmingLevel: Math.min(10, Math.max(1, Number.parseInt(params.farmingLevel || 1, 10) || 1)),
  };
  return parsed;
}

// speed reduction from fertilizer (Speed-Gro family)
export function computeSpeedReduction(fertilizerType) {
  // TODO: STARD EW VALLEY FORMULA CHECK - return Speed-Gro reductions
  const map = {
    'Speed-Gro': 0.10,
    'Deluxe Speed-Gro': 0.25,
    'Hyper_Speed-Gro': 0.33,
  };
  return map[fertilizerType] || 0;
}

export function applyGrowthModifiers(growthDays, regrowEvery, speedReduction, skills = {}) {
  // TODO: STARD EW VALLEY FORMULA CHECK - apply agriculturist 10% faster logic
  let effGrowth = Math.max(1, Math.ceil(growthDays * (1 - (speedReduction || 0))));
  let effRegrow = Math.max(0, Math.ceil((regrowEvery || 0) * (1 - (speedReduction || 0))));
  if (skills && skills.agriculturist) {
    effGrowth = Math.max(1, Math.floor(effGrowth * 0.9));
    if (effRegrow > 0) effRegrow = Math.max(1, Math.floor(effRegrow * 0.9));
  }
  return { effectiveGrowthDays: effGrowth, effectiveRegrowEvery: effRegrow };
}

export function fertilizerLevelFromType(fertilizerType) {
  // TODO: STARD EW VALLEY FORMULA CHECK - mapping levels used for quality formula
  const map = { None: 0, Basic_Fertilizer: 1, Quality_Fertilizer: 2, Deluxe_Fertilizer: 3 };
  return map[fertilizerType] ?? 0;
}

export function buildQualityProbabilities(level, fertilizerLevel) {
  // TODO: STARD EW VALLEY FORMULA CHECK - implement wiki formula (gold/silver/normal/iridium)
  // Minimal placeholder that follows a sequential model: iridium -> gold -> silver -> normal
  let pGold = 0.2 * (level / 10) + 0.2 * (fertilizerLevel) * ((level + 2) / 12) + 0.01;
  pGold = Math.max(0, Math.min(pGold, 0.99));
  let pSilverParam = Math.min(0.75, 2 * pGold);
  let pIridiumParam = fertilizerLevel >= 3 ? pGold / 2 : 0;
  let remaining = 1.0;
  const pIridium = Math.min(pIridiumParam, remaining); remaining -= pIridium;
  const pGoldFinal = Math.min(pGold, remaining); remaining -= pGoldFinal;
  const pSilverFinal = Math.min(pSilverParam, remaining); remaining -= pSilverFinal;
  const pNormal = Math.max(0, remaining);
  return { normal: pNormal, silver: pSilverFinal, gold: pGoldFinal, iridium: pIridium };
}

export function qualityValueMultipliers() {
  // TODO: STARD EW VALLEY FORMULA CHECK - verify multipliers
  return { normal: 1.0, silver: 1.25, gold: 1.5, iridium: 2.0 };
}

// Wrapper (or fallback) to reuse util.expectedFromQuality if available
export function expectedFromQualityHelper(valuesByTier, probabilities) {
  // TODO: STARD EW VALLEY FORMULA CHECK - decide whether to reuse util.expectedFromQuality
  try {
    return expectedFromQuality(valuesByTier, probabilities);
  } catch (e) {
    // simple fallback
    return (valuesByTier.normal || 0) * (probabilities.normal || 0) +
      (valuesByTier.silver || 0) * (probabilities.silver || 0) +
      (valuesByTier.gold || 0) * (probabilities.gold || 0) +
      (valuesByTier.iridium || 0) * (probabilities.iridium || 0);
  }
}

export function calculateHarvestCount(growthDays, regrowEvery, seasonDuration, isRegrow) {
  // TODO: STARD EW VALLEY FORMULA CHECK - ensure off-by-one logic matches game
  if (isRegrow && regrowEvery > 0) {
    const remaining = seasonDuration - growthDays;
    return remaining >= 0 ? 1 + Math.floor(remaining / regrowEvery) : 0;
  }
  return Math.floor(seasonDuration / Math.max(1, growthDays));
}

export function computePerHarvestExpectedValue(meta = {}, cropsPerHarvest = 1, isChanceMulti = false, isFixedMulti = false, level = 1, fertilizerLevel = 0, skills = {}) {
  // TODO: STARD EW VALLEY FORMULA CHECK - implement handling for "fertilizer only affects first unit"
  // Minimal placeholder: compute expected using provided meta and multipliers
  const multipliers = qualityValueMultipliers();
  const probsFirst = buildQualityProbabilities(level, fertilizerLevel);
  const probsOther = buildQualityProbabilities(level, 0);
  const firstValues = meta.firstValues || {};
  const otherValues = meta.otherValues || {};
  const expectedFirst = expectedFromQualityHelper(firstValues, probsFirst);
  const expectedOther = expectedFromQualityHelper(otherValues, probsOther);
  return expectedFirst + (cropsPerHarvest > 1 ? (cropsPerHarvest - 1) * expectedOther : 0);
}

export function computeTotalRevenueCostProfit(expectedPerHarvest, harvests, seedPrice, isRegrow, cropsPerTile, fertilizerCostPerTile = 0) {
  // TODO: STARD EW VALLEY FORMULA CHECK - include fertilizer cost per tile correctly
  const totalRevenue = expectedPerHarvest * harvests;
  const totalCost = isRegrow ? seedPrice : seedPrice * harvests;
  const totalCostWithFert = totalCost + (fertilizerCostPerTile || 0);
  const totalProfit = totalRevenue - totalCostWithFert;
  return { totalRevenue, totalCost: totalCostWithFert, totalProfit };
}

export function breakEvenHarvestsCalculation(seedPrice, adjustedValuePerHarvest, isRegrow) {
  // TODO: STARD EW VALLEY FORMULA CHECK - match original logic for break-even.
  if (isRegrow) return adjustedValuePerHarvest !== 0 ? seedPrice / adjustedValuePerHarvest : Infinity;
  const denom = adjustedValuePerHarvest - seedPrice;
  return denom !== 0 ? seedPrice / denom : Infinity;
}

export function getArtisanProductBaseValues(category, basePriceAfterTiller) {
  // TODO: STARD EW VALLEY FORMULA CHECK - verify artisan multipliers for categories
  const price = Number(basePriceAfterTiller) || 0;
  const out = {};
  if (category === 'fruit') {
    out.wine = 3 * price;
    out.dehydrated = 7.5 * price + 25;
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

export function computeArtisanExpectedValues(artisanBaseVals, probabilitiesWithFert, harvests, cropsPerTile, skills = {}) {

  const result = {};
  const multipliers = qualityValueMultipliers();
  for (const [productType, baseVal] of Object.entries(artisanBaseVals)) {
    const first = baseVal * (skills.artisan ? 1.04 : 1.0);
    const other = first;
    const valFirst = { normal: first, silver: first * multipliers.silver, gold: first * multipliers.gold, iridium: first * multipliers.iridium };
    const valOther = { normal: other, silver: other * multipliers.silver, gold: other * multipliers.gold, iridium: other * multipliers.iridium };
    const expectedFirst = expectedFromQualityHelper(valFirst, probabilitiesWithFert);
    const expectedOther = expectedFromQualityHelper(valOther, buildQualityProbabilities(0, 0));
    const expectedPerHarvest = expectedFirst + ((cropsPerTile > 1) ? (cropsPerTile - 1) * expectedOther : 0);
    result[productType] = { expectedPerHarvest, totalRevenue: expectedPerHarvest * harvests };
  }
  return result;
}

export function formatOutput(stats = {}, precision = 2) {
  // TODO: STARD EW VALLEY FORMULA CHECK - safe toFixed wrapper for all numeric outputs
  const out = {};
  for (const [k, v] of Object.entries(stats)) {
    out[k] = (typeof v === 'number') ? Number(v.toFixed(precision)) : v;
  }
  return out;
}

// Sanity-check scanner
export function scanForFormulas(sourceText = '') {
  const checks = [
    { key: 'gold_formula', patterns: [/0\.2\s*\*\s*\(level\s*\/\s*10\)/i, /0\.2\*\(level\/10\)/i], note: 'gold chance base formula' },
    { key: 'fert_level_term', patterns: [/\(level\s*\+\s*2\)\s*\/\s*12/i, /\(level\+2\)\/12/i], note: '(level+2)/12 term' },
    { key: 'fertilizer_level_cooccurrence', patterns: [/fertilizer/i, /level/i], cooccur: true, note: 'fertilizer + level co-occurrence' },
    { key: 'gold_chance_label', patterns: [/chanceGold/i, /pGold/i, /gold\s*chance/i], note: 'gold chance variable' },
    { key: 'silver_chance', patterns: [/pSilver/i, /silver\s*chance/i, /min\(0\.75/i], note: 'silver chance / min(0.75)' },
    { key: 'iridium_check', patterns: [/iridium/i, /pIridium/i, /fertilizerLevel\s*>=\s*3/i], note: 'iridium / deluxe fertilizer check' },
    { key: 'quality_mults', patterns: [/1\.25/i, /1\.5/i, /2\.0/i], note: 'quality multipliers (1.25/1.5/2.0)' },
    { key: 'first_yield_note', patterns: [/first\s*unit/i, /basic\s*harvest/i, /only\s*affects\s*the\s*first/i], note: 'fertilizer affects only first yield' },
    { key: 'regrow_calc', patterns: [/regrow/i, /regrowth/i, /floor\(|ceil\(|Math\.floor\(|Math\.ceil\(/i], note: 'regrow/regrowth calculation patterns' },
    { key: 'tiller_agri', patterns: [/tiller/i, /\+?10%|\*1\.1/i, /agriculturist/i, /\*0\.9|10%\s*faster/i], note: 'tiller + agriculturist effects' },
  ];

  const report = {};
  for (const chk of checks) {
    if (chk.cooccur) {
      const hasA = new RegExp(chk.patterns[0], 'i').test(sourceText);
      const hasB = new RegExp(chk.patterns[1], 'i').test(sourceText);
      report[chk.key] = (hasA && hasB) ? { found: true } : { found: false, note: chk.note };
    } else {
      const found = chk.patterns.some((p) => (typeof p === 'string' ? sourceText.toLowerCase().includes(p.toLowerCase()) : p.test(sourceText)));
      report[chk.key] = found ? { found: true } : { found: false, note: chk.note };
    }
  }

  console.log('Formula presence scan report:');
  for (const [k, v] of Object.entries(report)) {
    console.log(`${k} -> ${v.found ? 'FOUND' : 'MISSING'}${v.found ? '' : ` -- ${v.note}`}`);
  }
  return report;
}

// Test skeletons (non-asserting outputs) to show expected usage
export function runTestSkeletons() {
  console.log('Running calculation helper test skeletons...');
  // 1) Single-yield crop (no fertilizer)
  const single = parseAndValidateInputs({ seedPrice: 10, cropPrice: 50, cropGrowthDays: 5, seasonDuration: 28 });
  const singleHarvests = calculateHarvestCount(single.growthDays, single.regrowEvery, single.seasonDuration, false);
  console.log('Single-yield test', { single, harvests: singleHarvests });

  // 2) Chance-multi-yield (potato-like): only first item affected by fertilizer
  const potatoMeta = { firstValues: { normal: 40 }, otherValues: { normal: 40 } };
  const potatoEV = computePerHarvestExpectedValue(potatoMeta, 1, true, false, 1, 1, {});
  console.log('Potato-like chance-multi test', { potatoEV });

  // 3) Fixed-multi-yield regrow crop (cranberry-like)
  const cranberry = parseAndValidateInputs({ seedPrice: 100, cropPrice: 75, cropGrowthDays: 7, cropRegrowthEvery: 5, seasonDuration: 28, cropsPerTile: 3 });
  const cranHarvests = calculateHarvestCount(cranberry.growthDays, cranberry.regrowEvery, cranberry.seasonDuration, true);
  const cranEV = computePerHarvestExpectedValue({ firstValues: { normal: 75 }, otherValues: { normal: 75 } }, cranberry.cropsPerTile, false, true, cranberry.farmingLevel, 0, {});
  console.log('Cranberry-like fixed-multi regrow test', { cranberry, harvests: cranHarvests, perHarvestEV: cranEV });

  console.log('Test skeletons complete. These are scaffolding outputs; replace with assertions in real tests.');
}

// Quick actionable summary function
export function helperSummary() {
  console.log('Helper stubs added: parseAndValidateInputs, computeSpeedReduction, applyGrowthModifiers, fertilizerLevelFromType, buildQualityProbabilities, qualityValueMultipliers, expectedFromQualityHelper, calculateHarvestCount, computePerHarvestExpectedValue, computeTotalRevenueCostProfit, breakEvenHarvestsCalculation, getArtisanProductBaseValues, computeArtisanExpectedValues, formatOutput.');
  console.log('Sanity scanner: scanForFormulas(sourceText) added. Run on file contents to see missing formula pieces.');
  console.log('Next steps: review comments marked // TODO: STARD EW VALLEY FORMULA CHECK and implement exact game formulas where noted.');
}
