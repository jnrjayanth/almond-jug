import { describe, expect, it } from 'vitest';
import {
  waterFromTokens,
  almondsFromMl,
  formatMl,
  ALMOND_ML,
  WATER_ML_PER_TOKEN,
  ML_PER_GALLON,
} from './water';

describe('waterFromTokens', () => {
  it('returns zero for no tokens', () => {
    expect(waterFromTokens(0)).toEqual({ low: 0, central: 0, high: 0 });
  });

  it('matches the provider figure at its reference length', () => {
    expect(waterFromTokens(400).central).toBeCloseTo(45, 5);
  });

  it('keeps low below central below high', () => {
    const w = waterFromTokens(1000);
    expect(w.low).toBeLessThan(w.central);
    expect(w.central).toBeLessThanOrEqual(w.high);
  });

  it('scales linearly', () => {
    expect(waterFromTokens(2000).central).toBeCloseTo(
      waterFromTokens(1000).central * 2,
      5
    );
  });
});

describe('almondsFromMl', () => {
  it('counts one almond at the industry figure', () => {
    expect(almondsFromMl(ALMOND_ML.industry)).toBeCloseTo(1, 5);
  });

  it('gives fewer almonds on the full-footprint basis', () => {
    const ml = 10_000;
    expect(almondsFromMl(ml, 'fullFootprint')).toBeLessThan(
      almondsFromMl(ml, 'industry')
    );
  });
});

describe('sanity checks', () => {
  it('needs tens of thousands of tokens to fill a gallon', () => {
    const tokens = ML_PER_GALLON / WATER_ML_PER_TOKEN.provider;
    expect(tokens).toBeGreaterThan(10_000);
    expect(tokens).toBeLessThan(100_000);
  });
});

describe('formatMl', () => {
  it('switches to litres above 1000 mL', () => {
    expect(formatMl(1500)).toBe('1.50 L');
  });
  it('marks very small amounts', () => {
    expect(formatMl(0.001)).toBe('<0.01 mL');
  });
});