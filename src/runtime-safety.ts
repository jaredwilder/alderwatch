import {Landscape} from './landscape';
import {Nature} from './nature';
import {LocalAuthority,type PlayerState,type WorldState} from './state';

/**
 * Last-line runtime migration for additive development.
 *
 * Alderwatch deliberately evolves saves without wiping them. Every system is
 * expected to tolerate older optional fields, but the live loader should never
 * be taken down because a new presentation module calls `.includes()` on a
 * collection that did not exist in an older realm. This function is idempotent
 * and owns that invariant at system boundaries.
 */
export function ensureRuntimeWorld<T extends WorldState>(world:T):T{
 const w=world as any;
 w.players??={};w.resources??={};w.forage??={};w.drops??={};w.structures??={};w.stations??={};w.containers??={};w.enemies??={};w.animals??={};w.expeditionSites??={};w.bountySites??={};
 w.opened=Array.isArray(w.opened)?w.opened:[];w.progress=Array.isArray(w.progress)?w.progress:[];w.nextId=Number.isFinite(w.nextId)?w.nextId:1;w.tick=Number.isFinite(w.tick)?w.tick:0;
 for(const p of Object.values(w.players) as PlayerState[]){const x=p as any;x.inventory=Array.isArray(x.inventory)?x.inventory:[];x.buffs=Array.isArray(x.buffs)?x.buffs:[];x.skills=x.skills&&typeof x.skills==='object'?x.skills:{};if(x.bounties){x.bounties.completed=Array.isArray(x.bounties.completed)?x.bounties.completed:[];x.bounties.completedAnimals=Array.isArray(x.bounties.completedAnimals)?x.bounties.completedAnimals:[];}if(x.expedition)x.expedition.recovered=Array.isArray(x.expedition.recovered)?x.expedition.recovered:[];}
 for(const c of Object.values(w.containers) as any[])c.inventory=Array.isArray(c.inventory)?c.inventory:[];
 return world;
}

export function progressHas(world:WorldState,key:string){return ensureRuntimeWorld(world).progress.includes(key);}
export function progressAdd(world:WorldState,key:string){const w=ensureRuntimeWorld(world);if(!w.progress.includes(key))w.progress.push(key);}

const installed=Symbol.for('alderwatch.runtime-safety.v1');
export function installRuntimeSafety(){const g=globalThis as any;if(g[installed])return;g[installed]=true;
 const lp=Landscape.prototype as any;if(!lp.__awRuntimeSafety){const terrain=lp.terrain;lp.terrain=function(...args:any[]){ensureRuntimeWorld(this.state);return terrain.apply(this,args);};const update=lp.update;if(update)lp.update=function(...args:any[]){ensureRuntimeWorld(this.state);return update.apply(this,args);};lp.__awRuntimeSafety=true;}
 const np=Nature.prototype as any;if(!np.__awRuntimeSafety){const update=np.update;np.update=function(...args:any[]){ensureRuntimeWorld(this.w);return update.apply(this,args);};np.__awRuntimeSafety=true;}
 const ap=LocalAuthority.prototype as any;if(!ap.__awRuntimeSafety){const dispatch=ap.dispatch;ap.dispatch=function(...args:any[]){ensureRuntimeWorld(this.state);return dispatch.apply(this,args);};ap.__awRuntimeSafety=true;}
}

installRuntimeSafety();
