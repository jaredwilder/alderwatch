export type SettlementRegime = 'calm' | 'strained' | 'alert' | 'besieged' | 'recovering';
export const SETTLEMENT_REGIMES: readonly SettlementRegime[] = ['calm','strained','alert','besieged','recovering'];

export interface SettlementDelta {
  population: number;
  food: number;
  iron: number;
  treasury: number;
  guards: number;
  danger: number;
}

export interface SettlementMacroState extends SettlementDelta {
  regime: SettlementRegime;
}

export type WorldEventKind =
  | 'ordinary_day'
  | 'market_day'
  | 'harvest'
  | 'caravan_arrival'
  | 'bandit_raid'
  | 'guard_reinforcement'
  | 'winter_shortage'
  | 'recovery_day';

export interface WorldEvent {
  kind: WorldEventKind;
  magnitude?: number;
  /** Events touching unique identities are sparse exceptions and cannot be macro-compiled. */
  exceptionId?: string;
}

export interface TransitionResult {
  regime: SettlementRegime;
  delta: SettlementDelta;
}

export interface WorldBlockSummary {
  /** Exact table over the declared finite semantic machine. */
  table: Record<SettlementRegime, TransitionResult>;
  eventCount: number;
}

const ZERO: SettlementDelta = {population:0,food:0,iron:0,treasury:0,guards:0,danger:0};
const add = (a:SettlementDelta,b:SettlementDelta):SettlementDelta => ({
  population:a.population+b.population,
  food:a.food+b.food,
  iron:a.iron+b.iron,
  treasury:a.treasury+b.treasury,
  guards:a.guards+b.guards,
  danger:a.danger+b.danger,
});

const clampMagnitude = (event:WorldEvent) => Math.max(1, Math.min(8, Math.trunc(event.magnitude ?? 1)));

/**
 * One exact offscreen settlement step. This is intentionally small: it is the Court
 * model proving the representation, not yet the final Ironward economy.
 */
export function settlementStep(regime:SettlementRegime,event:WorldEvent):TransitionResult {
  if (event.exceptionId) throw new Error(`Sparse exception ${event.exceptionId} requires explicit simulation`);
  const m=clampMagnitude(event);
  switch(event.kind){
    case 'ordinary_day': {
      if(regime==='besieged') return {regime:'besieged',delta:{...ZERO,food:-2*m,treasury:-m,danger:m}};
      if(regime==='alert') return {regime:'strained',delta:{...ZERO,food:-m,treasury:m,danger:-m}};
      if(regime==='recovering') return {regime:'calm',delta:{...ZERO,food:-m,treasury:m,danger:-2*m}};
      return {regime,delta:{...ZERO,food:-m,treasury:m}};
    }
    case 'market_day':
      return {regime:regime==='besieged'?'besieged':regime,delta:{...ZERO,food:-m,iron:-m,treasury:4*m,danger:regime==='alert'?-m:0}};
    case 'harvest':
      return {regime:regime==='strained'?'calm':regime,delta:{...ZERO,food:7*m,treasury:m,danger:-m}};
    case 'caravan_arrival':
      return {regime:regime==='strained'?'calm':regime,delta:{...ZERO,food:3*m,iron:4*m,treasury:-2*m,danger:-m}};
    case 'bandit_raid': {
      const severe=regime==='alert'||regime==='besieged'||m>=4;
      return {regime:severe?'besieged':'alert',delta:{population:-m,food:-2*m,iron:-m,treasury:-3*m,guards:-m,danger:4*m}};
    }
    case 'guard_reinforcement':
      return {regime:regime==='besieged'?'alert':regime==='alert'?'strained':regime,delta:{...ZERO,treasury:-3*m,guards:2*m,danger:-3*m}};
    case 'winter_shortage':
      return {regime:regime==='besieged'?'besieged':'strained',delta:{population:m>=5?-1:0,food:-5*m,treasury:-m,danger:2*m,iron:0,guards:0}};
    case 'recovery_day':
      return {regime:regime==='besieged'?'recovering':regime==='alert'?'strained':regime==='strained'?'calm':regime,delta:{...ZERO,food:-m,treasury:-m,guards:m,danger:-2*m}};
  }
}

export function applySettlementEvent(state:SettlementMacroState,event:WorldEvent):SettlementMacroState {
  const step=settlementStep(state.regime,event),d=step.delta;
  return {
    regime:step.regime,
    population:state.population+d.population,
    food:state.food+d.food,
    iron:state.iron+d.iron,
    treasury:state.treasury+d.treasury,
    guards:state.guards+d.guards,
    danger:state.danger+d.danger,
  };
}

export function replaySettlement(initial:SettlementMacroState,events:readonly WorldEvent[]):SettlementMacroState {
  return events.reduce(applySettlementEvent,structuredClone(initial));
}

export function identityWorldBlock():WorldBlockSummary {
  return {
    eventCount:0,
    table:Object.fromEntries(SETTLEMENT_REGIMES.map(regime=>[regime,{regime,delta:{...ZERO}}])) as Record<SettlementRegime,TransitionResult>,
  };
}

export function summarizeEvent(event:WorldEvent):WorldBlockSummary {
  if(event.exceptionId) throw new Error(`Sparse exception ${event.exceptionId} cannot enter a macro world block`);
  return {
    eventCount:1,
    table:Object.fromEntries(SETTLEMENT_REGIMES.map(regime=>[regime,settlementStep(regime,event)])) as Record<SettlementRegime,TransitionResult>,
  };
}

/** Ordered semidirect composition: first a, then b. */
export function composeWorldBlocks(a:WorldBlockSummary,b:WorldBlockSummary):WorldBlockSummary {
  const table={} as Record<SettlementRegime,TransitionResult>;
  for(const start of SETTLEMENT_REGIMES){
    const first=a.table[start],second=b.table[first.regime];
    table[start]={regime:second.regime,delta:add(first.delta,second.delta)};
  }
  return {table,eventCount:a.eventCount+b.eventCount};
}

export function summarizeEvents(events:readonly WorldEvent[]):WorldBlockSummary {
  let summary=identityWorldBlock();
  for(const event of events) summary=composeWorldBlocks(summary,summarizeEvent(event));
  return summary;
}

export function applyWorldBlock(initial:SettlementMacroState,summary:WorldBlockSummary):SettlementMacroState {
  const outcome=summary.table[initial.regime],d=outcome.delta;
  return {
    regime:outcome.regime,
    population:initial.population+d.population,
    food:initial.food+d.food,
    iron:initial.iron+d.iron,
    treasury:initial.treasury+d.treasury,
    guards:initial.guards+d.guards,
    danger:initial.danger+d.danger,
  };
}

/** Epoch boundary: current exact macrostate becomes the next epoch's initial state. */
export function rebaseSettlement(current:SettlementMacroState):{checkpoint:SettlementMacroState;nextBlock:WorldBlockSummary} {
  return {checkpoint:structuredClone(current),nextBlock:identityWorldBlock()};
}

export function worldBlockKey(summary:WorldBlockSummary):string {
  return SETTLEMENT_REGIMES.map(start=>{
    const out=summary.table[start],d=out.delta;
    return `${start}>${out.regime}:${d.population},${d.food},${d.iron},${d.treasury},${d.guards},${d.danger}`;
  }).join('|');
}
