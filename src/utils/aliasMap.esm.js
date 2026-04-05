export const aliasMap = [
  { pattern: "\\b(wom[ea]n|lad(?:y|ies)|girls?)\\b.*\\bwatch|\\bwatch(es)?\\b", category: 'Watch', slugs: ['womens-watches'] },
  { pattern: "\\b(men|mens|gents|boys?)\\b.*\\bwatch|\\bwatch(es)?\\b", category: 'Watch', slugs: ['mens-watches'] },
  { pattern: "\\b(watch|watches)\\b", category: 'Watch' },
  { pattern: "\\b(drinkware|water bottle|tumbler|insulated|bottle|flask)\\b", category: 'Drinkware' },
  { pattern: "\\b(wallet|wallets|card holder|card-holder)\\b", category: 'Wallet' },
  { pattern: "\\b(bag|backpack|handbag|korean bag|laptop bag|back pack)\\b", category: 'Bag' },
  { pattern: "\\b(keychain|key chain|key-chain|keyring)\\b", category: 'Keychain' },
  { pattern: "\\b(bracelet|bracelets|friendship|bestie|bff|kids bracelet|kids bracelets)\\b", category: 'Bracelet', slugs: ['girls-accessories', 'friendship-bands', 'kids-bracelets'] },
  { pattern: "\\b(bangle|bangles|kundan)\\b", category: 'Bangle' },
  { pattern: "\\b(gift|gifts|couple|matching|present)\\b", category: 'Gift', slugs: ['couple-gifts'] },
  { pattern: "\\b(toy|toys|die-cast|die cast|model)\\b", category: 'Toys' }
];

export function compileAliasMap(list) {
  return list.map((item) => ({ ...item, regex: new RegExp(item.pattern, 'i') }));
}

export default { aliasMap, compileAliasMap };
