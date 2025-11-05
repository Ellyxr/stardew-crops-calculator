#!/usr/bin/env node
// repro-strawberry.js
// Headless runner: imports calculateCropStats and prints helper snapshot and result

import { calculateCropStats } from '../public/calculation.js';
import * as CH from '../public/calculation_helpers.js';

// Strawberry typical inputs (adjust if you used different UI values)
const inputs = {
  cropName: 'Strawberry',
  seedPrice: 100,
  cropPrice: 120,
  cropGrowthDays: 8,
  cropRegrowth: true,
  cropRegrowthEvery: 4,
  seasonDuration: 28,
  cropsPerTile: 1,
  fertilizerType: 'Basic_Fertilizer',
  farmingLevel: 10,
  skills: { tiller: true, agriculturist: true, artisan: false },
};

console.log('\n== Running Strawberry reproduction runner ==');
console.log('Inputs:', inputs);

// Run helper scanner quickly (optional)
if (CH && typeof CH.scanForFormulas === 'function') {
  console.log('\n-- formula presence scan --');
  CH.scanForFormulas((await import('fs')).readFileSync(new URL('../public/calculation.js', import.meta.url), 'utf8'));
}

// Run calculateCropStats (the helper-snapshot inside will log debug info)
try {
  const stats = calculateCropStats(inputs);
  console.log('\n-- calculateCropStats result (partial) --');
  // Print a compact selection of key fields to keep output readable
  console.log({ name: stats.name, expectedValuePerHarvest: stats.qualityTiers.expectedValuePerHarvest, adjustedValuePerHarvest: stats.qualityTiers.adjustedValuePerHarvest, harvests: stats.harvests, totalRevenue: stats.totalRevenue, totalCost: stats.totalCost, totalProfit: stats.totalProfit });
} catch (e) {
  console.error('Error running calculateCropStats:', e);
  process.exitCode = 2;
}

console.log('\n== reproduction complete ==\n');
