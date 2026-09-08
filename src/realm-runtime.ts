export type AreaId = 'far-march' | string;

export interface AreaLocation {
  areaId: AreaId;
  position: [number, number, number];
  yaw: number;
}

export interface AreaSnapshot {
  areaId: AreaId;
  enteredAtTick: number;
  leftAtTick?: number;
  visitCount: number;
}

export interface RealmRuntimeState {
  version: 1;
  activeAreaId: AreaId;
  areas: Record<AreaId, AreaSnapshot>;
}

export interface AreaLifecycle<T> {
  id: AreaId;
  load(): T;
  dispose(runtime: T): void;
}

export function seedRealmRuntime(tick = 0): RealmRuntimeState {
  return {
    version: 1,
    activeAreaId: 'far-march',
    areas: {
      'far-march': {
        areaId: 'far-march',
        enteredAtTick: tick,
        // Runtime construction has not materialized the area yet. The first `enter`
        // records visit #1, avoiding a phantom visit in new worlds and test fixtures.
        visitCount: 0,
      },
    },
  };
}

export function normalizeRealmRuntime(runtime: RealmRuntimeState | undefined, tick = 0): RealmRuntimeState {
  if (!runtime || runtime.version !== 1 || !runtime.activeAreaId || !runtime.areas) return seedRealmRuntime(tick);
  const active = runtime.areas[runtime.activeAreaId];
  if (!active) {
    runtime.areas[runtime.activeAreaId] = {
      areaId: runtime.activeAreaId,
      enteredAtTick: tick,
      visitCount: 0,
    };
  }
  return runtime;
}

/**
 * Owns the expensive lifetime of one loaded area at a time. Authoritative world/save
 * state remains outside this class; this object guarantees ordered dispose -> load.
 */
export class RealmManager<T> {
  private active?: { definition: AreaLifecycle<T>; runtime: T };

  constructor(
    private readonly definitions: ReadonlyMap<AreaId, AreaLifecycle<T>>,
    readonly state: RealmRuntimeState,
  ) {}

  get activeAreaId() {
    return this.state.activeAreaId;
  }

  get activeRuntime(): T | undefined {
    return this.active?.runtime;
  }

  enter(areaId: AreaId, tick: number): T {
    const definition = this.definitions.get(areaId);
    if (!definition) throw new Error(`Unknown Alderwatch area: ${areaId}`);
    if (this.active?.definition.id === areaId) return this.active.runtime;

    if (this.active) {
      const outgoing = this.state.areas[this.active.definition.id];
      if (outgoing) outgoing.leftAtTick = tick;
      this.active.definition.dispose(this.active.runtime);
      this.active = undefined;
    }

    const snapshot = this.state.areas[areaId];
    if (snapshot) {
      snapshot.enteredAtTick = tick;
      snapshot.leftAtTick = undefined;
      snapshot.visitCount += 1;
    } else {
      this.state.areas[areaId] = { areaId, enteredAtTick: tick, visitCount: 1 };
    }

    const runtime = definition.load();
    this.active = { definition, runtime };
    this.state.activeAreaId = areaId;
    return runtime;
  }

  dispose(tick: number): void {
    if (!this.active) return;
    const snapshot = this.state.areas[this.active.definition.id];
    if (snapshot) snapshot.leftAtTick = tick;
    this.active.definition.dispose(this.active.runtime);
    this.active = undefined;
  }
}
