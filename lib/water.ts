// PLACEHOLDER VALUES — replace with sourced low/central/high figures on Day 3.
// Published per-query estimates vary by orders of magnitude depending on
// what is counted (on-site cooling only vs. electricity generation too).

export type Estimate = { low: number; central: number; high: number };

export const ASSUMED_TOKENS_PER_QUERY = 400; // assumption used to convert per-query to per-token

export const WATER_ML_PER_QUERY: Estimate = { low: 0.3, central: 8, high: 50 };

export const WATER_ML_PER_TOKEN: Estimate = {
  low: WATER_ML_PER_QUERY.low / ASSUMED_TOKENS_PER_QUERY,
  central: WATER_ML_PER_QUERY.central / ASSUMED_TOKENS_PER_QUERY,
  high: WATER_ML_PER_QUERY.high / ASSUMED_TOKENS_PER_QUERY,
};

export const ML_PER_GALLON = 3785.41;

// The jug fills to this amount visually, so a short session is visible.
// Shown on the page as a labelled, scaled view; the true gallon % is shown as text.

export function waterFromTokens(totalTokens: number): Estimate {
  return {
    low: totalTokens * WATER_ML_PER_TOKEN.low,
    central: totalTokens * WATER_ML_PER_TOKEN.central,
    high: totalTokens * WATER_ML_PER_TOKEN.high,
  };
}

export function formatMl(ml: number): string {
  if (ml === 0) return '0 mL';
  if (ml < 0.01) return '<0.01 mL';
  if (ml < 10) return `${ml.toFixed(2)} mL`;
  if (ml < 1000) return `${ml.toFixed(1)} mL`;
  return `${(ml / 1000).toFixed(2)} L`;
}