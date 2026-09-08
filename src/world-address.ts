export interface WorldAddress {
  realmSeed: number;
  areaId: string;
  cellX: number;
  cellZ: number;
  slot: number;
  tag: string;
  epoch?: number;
}

function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mix32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return (x ^ (x >>> 15)) >>> 0;
}

/** Random-access deterministic bits. No mutable RNG stream and no generation-order dependency. */
export function worldBits(address: WorldAddress): number {
  let h = mix32(address.realmSeed >>> 0);
  h = mix32(h ^ fnv1a32(address.areaId));
  h = mix32(h ^ Math.imul(address.cellX | 0, 0x9e3779b1));
  h = mix32(h ^ Math.imul(address.cellZ | 0, 0x85ebca77));
  h = mix32(h ^ Math.imul(address.slot | 0, 0xc2b2ae3d));
  h = mix32(h ^ fnv1a32(address.tag));
  h = mix32(h ^ Math.imul(address.epoch ?? 0, 0x27d4eb2d));
  return h >>> 0;
}

export function worldRandom(address: WorldAddress): number {
  return worldBits(address) / 0x1_0000_0000;
}

export function worldInt(address: WorldAddress, exclusiveMax: number): number {
  if (!Number.isSafeInteger(exclusiveMax) || exclusiveMax <= 0) throw new Error('exclusiveMax must be a positive safe integer');
  return Math.floor(worldRandom(address) * exclusiveMax);
}

export function worldChance(address: WorldAddress, probability: number): boolean {
  if (!(probability >= 0 && probability <= 1)) throw new Error('probability must be in [0,1]');
  return worldRandom(address) < probability;
}

/** Morton/Z-order key for locality-aware cell persistence and work partitioning. */
export function morton2D(x: number, z: number): bigint {
  const ux = BigInt.asUintN(32, BigInt(x | 0));
  const uz = BigInt.asUintN(32, BigInt(z | 0));
  let out = 0n;
  for (let bit = 0n; bit < 32n; bit++) {
    out |= ((ux >> bit) & 1n) << (bit * 2n);
    out |= ((uz >> bit) & 1n) << (bit * 2n + 1n);
  }
  return out;
}

export function cellId(areaId: string, x: number, z: number): string {
  return `${areaId}:${morton2D(x, z).toString(36)}`;
}
