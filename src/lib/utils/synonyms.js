import { aliasMap, compileAliasMap } from './aliasMap.js';
import { slugify } from './slug.js';

const compiledAliases = compileAliasMap(aliasMap);

export function tokenize(str) {
  return String(str || '').split(/\s+/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

// Map individual tokens -> category slugs based on aliasMap patterns or token map
export function mapTokensToSlugs(tokens = []) {
  const slugs = new Set();

  const tokenMap = {
    boys: ['boys-accessories', 'mens-watches'],
    boy: ['boys-accessories', 'mens-watches'],
    men: ['mens-watches'],
    mens: ['mens-watches'],
    gents: ['mens-watches'],
    girls: ['girls-accessories'],
    women: ['womens-watches', 'girls-accessories'],
    wallet: ['boys-accessories', 'wallets'],
    watch: ['mens-watches', 'womens-watches'],
  };

  tokens.forEach(tok => {
    if (tokenMap[tok]) tokenMap[tok].forEach(s => slugs.add(s));
    try {
      compiledAliases.forEach(a => {
        if (a.regex && a.regex.test(tok) && a.slugs) {
          (Array.isArray(a.slugs) ? a.slugs : [a.slugs]).forEach(s => slugs.add(s));
        }
      });
    } catch (e) {}
  });

  return Array.from(slugs);
}

export function mapQueryToSlugs(query) {
  const slugs = new Set();
  if (!query) return [];
  try {
    compiledAliases.forEach(a => {
      if (a.regex.test(query)) {
        (Array.isArray(a.slugs) ? a.slugs : [a.slugs]).forEach(s => slugs.add(s));
      }
    });
  } catch (e) {}
  return Array.from(slugs);
}

export default {
  mapTokensToSlugs,
  mapQueryToSlugs,
};
