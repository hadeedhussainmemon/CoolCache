import { describe, it, expect } from 'vitest';

describe('Backend/utils/synonyms', () => {
  it('maps token "boys" to boys-accessories and mens-watches', async () => {
    const mod = await import('../synonyms.js');
    const synonyms = mod.default || mod;
    const { mapTokensToSlugs } = synonyms;
    const result = mapTokensToSlugs(['boys']);
    expect(result).toEqual(expect.arrayContaining(['boys-accessories', 'mens-watches']));
  });

  it('maps full query to slug using aliasMap regex (watch for men)', async () => {
    const mod = await import('../synonyms.js');
    const synonyms = mod.default || mod;
    const { mapQueryToSlugs } = synonyms;
    const result = mapQueryToSlugs('watch for men');
    expect(result).toEqual(expect.arrayContaining(['mens-watches']));
  });

  it('is case-insensitive and handles single-word watch token', async () => {
    const mod = await import('../synonyms.js');
    const synonyms = mod.default || mod;
    const { mapTokensToSlugs } = synonyms;
    const result = mapTokensToSlugs(['Watch']);
    expect(result).toEqual(expect.arrayContaining(['mens-watches', 'womens-watches']));
  });

  it('returns an empty array for unknown tokens', async () => {
    const mod = await import('../synonyms.js');
    const synonyms = mod.default || mod;
    const { mapTokensToSlugs } = synonyms;
    const result = mapTokensToSlugs(['foobar']);
    expect(result).toEqual([]);
  });
});
