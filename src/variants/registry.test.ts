import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRegistry,
  getVariant,
  isVariantRegistered,
  listVariants,
  registerVariant,
} from './registry';
import type { VariantManifest } from './types';

function makeManifest(id: string, displayName = id): VariantManifest {
  return {
    id,
    displayName,
    domain: { values: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    regionsKind: 'standard',
    visualChannels: [],
    tutorialOneLiner: 'tut',
    rulePanelMD: 'rule',
    difficulties: ['easy'],
    adapter: {
      generate() {
        throw new Error('not implemented');
      },
      serialize() {
        return '';
      },
      deserialize() {
        throw new Error('not implemented');
      },
    },
  };
}

describe('variant registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers and retrieves a variant by id', () => {
    const m = makeManifest('foo');
    registerVariant(m);
    expect(getVariant('foo')).toBe(m);
  });

  it('listVariants returns manifests in registration order', () => {
    const a = makeManifest('a');
    const b = makeManifest('b');
    const c = makeManifest('c');
    registerVariant(a);
    registerVariant(b);
    registerVariant(c);
    expect(listVariants().map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('throws for unregistered id', () => {
    expect(() => getVariant('missing')).toThrow();
  });

  it('isVariantRegistered reflects registration state', () => {
    expect(isVariantRegistered('x')).toBe(false);
    registerVariant(makeManifest('x'));
    expect(isVariantRegistered('x')).toBe(true);
    expect(isVariantRegistered('y')).toBe(false);
  });

  it('replaces an existing manifest when re-registered with the same id', () => {
    const first = makeManifest('dup', 'first');
    const second = makeManifest('dup', 'second');
    registerVariant(first);
    registerVariant(second);
    expect(getVariant('dup')).toBe(second);
    expect(getVariant('dup').displayName).toBe('second');
    expect(listVariants()).toHaveLength(1);
  });

  it('clearRegistry empties the registry', () => {
    registerVariant(makeManifest('a'));
    registerVariant(makeManifest('b'));
    clearRegistry();
    expect(listVariants()).toEqual([]);
    expect(isVariantRegistered('a')).toBe(false);
  });
});
