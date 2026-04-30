import type { VariantManifest } from './types';

const registry = new Map<string, VariantManifest>();

export function registerVariant(m: VariantManifest): void {
  registry.set(m.id, m);
}

export function getVariant(id: string): VariantManifest {
  const m = registry.get(id);
  if (!m) throw new Error(`Variant not registered: ${id}`);
  return m;
}

export function listVariants(): VariantManifest[] {
  return Array.from(registry.values());
}

export function isVariantRegistered(id: string): boolean {
  return registry.has(id);
}

export function clearRegistry(): void {
  registry.clear();
}
