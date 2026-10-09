/**
 * Water-footprint constants and conversions.
 *
 * All figures are modeled estimates, not measurements. Published per-query
 * water estimates differ by orders of magnitude mainly because of SCOPE:
 * whether a figure counts only on-site data-centre cooling, or also the
 * water consumed generating the electricity.
 */

export type Scenario = 'onsite' | 'modern' | 'provider';

export type WaterRange = { low: number; central: number; high: number };

/** mL of water per token, under three published scopes. */
export const WATER_ML_PER_TOKEN: Record<Scenario, number> = {
  // Google, median Gemini Apps text prompt, May 2025. On-site cooling only.
  // 0.26 mL per prompt, normalised to a 400-token reference response.
  onsite: 0.26 / 400,

  // Independent 2026 estimates for a modern fleet, including a share of
  // power-plant water: roughly 1-5 mL per query. Midpoint 3 mL.
  modern: 3 / 400,

  // Mistral AI life cycle assessment (2025), with Carbone 4 and ADEME,
  // peer-reviewed by Resilio and Hubblo: 45 mL for a 400-token Le Chat
  // response (Mistral Large 2), direct + indirect, excluding user devices.
  // Used as our headline: it is this app's own provider's published figure.
  provider: 45 / 400,
};

export const DEFAULT_SCENARIO: Scenario = 'provider';

export const SOURCES = {
  onsite: 'Google, median Gemini Apps text prompt (2025) — on-site cooling only',
  modern: 'Independent 2026 estimates, modern fleet — includes power generation',
  provider:
    'Mistral AI lifecycle assessment (2025), Carbone 4 / ADEME, peer-reviewed — 45 mL per 400-token response, Mistral Large 2',
} as const;

/** mL of water per California almond kernel. */
export const ALMOND_ML = {
  // Almond Board of California: 1.1 gallons per kernel.
  industry: 1.1 * 3785.41,
  // Pacific Institute (2014), USDA yields + UC Davis irrigation: 1.6-1.7 gal.
  irrigation: 1.65 * 3785.41,
  // Fulton et al. 2019, Ecological Indicators: 12 L per kernel
  // (10,240 L/kg kernels; blue + green + grey water).
  fullFootprint: 12_000,
} as const;

export const ALMOND_SOURCES = {
  industry: 'Almond Board of California — 1.1 gal per kernel',
  irrigation: 'Pacific Institute (2014) — 1.6-1.7 gal per kernel',
  fullFootprint:
    'Fulton et al. (2019), Ecological Indicators — 12 L per kernel, blue + green + grey',
} as const;

export const ML_PER_GALLON = 3785.41;

/** The model these estimates are applied to, for the methodology page. */
export const MODEL_NOTE =
  'Figures are applied to Mistral Small. The provider estimate was published for Mistral Large 2, a larger model, so it likely overstates this app.';

export function waterFromTokens(totalTokens: number): WaterRange {
  const perToken = Object.values(WATER_ML_PER_TOKEN);
  return {
    low: totalTokens * Math.min(...perToken),
    central: totalTokens * WATER_ML_PER_TOKEN[DEFAULT_SCENARIO],
    high: totalTokens * Math.max(...perToken),
  };
}

export function almondsFromMl(
  ml: number,
  basis: keyof typeof ALMOND_ML = 'industry'
): number {
  return ml / ALMOND_ML[basis];
}

export function formatMl(ml: number): string {
  if (ml === 0) return '0 mL';
  if (ml < 0.01) return '<0.01 mL';
  if (ml < 10) return `${ml.toFixed(2)} mL`;
  if (ml < 1000) return `${ml.toFixed(1)} mL`;
  return `${(ml / 1000).toFixed(2)} L`;
}