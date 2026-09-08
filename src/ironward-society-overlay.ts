import {loadWorld} from './state';
import {REALM_POPULATION_DAY_TICKS,ensureRealmPopulation} from './realm-population';
import {GATEWATCH_SHARD,HOUSEHOLDS_PER_SHARD,advanceRealmSocietyToTick,describeHousehold,householdLore,wardPopulationHistogram,wardSocialSignature} from './realm-society';
import './social-lore.css';

const host=document.querySelector<HTMLElement>('#ui')??document.body;
const panel=document.createElement('aside');panel.id='gatewatch-chronicle';panel.innerHTML='<small>THE GATEWATCH CHRONICLE</small><strong></strong><p class="household-lore"></p><p class="chronicle-line"></p><div class="social-signal"></div>';host.append(panel);
let savedTick=-1,savedAt=performance.now(),cycle=-1;

function render(){
 const saved=loadWorld();if(!saved)return;const now=performance.now();if(saved.tick!==savedTick){savedTick=saved.tick;savedAt=now;}const world=structuredClone(saved);world.tick=savedTick+Math.floor((now-savedAt)*.06);ensureRealmPopulation(world);advanceRealmSocietyToTick(world);
 const seed=world.worldSeed??197709,day=Math.floor(world.tick/REALM_POPULATION_DAY_TICKS),nextCycle=Math.floor(now/8000);if(nextCycle===cycle&&panel.dataset.day===String(day))return;cycle=nextCycle;panel.dataset.day=String(day);
 const population=ensureRealmPopulation(world),local=((day*17+cycle*73)%HOUSEHOLDS_PER_SHARD+HOUSEHOLDS_PER_SHARD)%HOUSEHOLDS_PER_SHARD,household=describeHousehold(population,seed,GATEWATCH_SHARD*HOUSEHOLDS_PER_SHARD+local),signature=wardSocialSignature(wardPopulationHistogram(population,seed,GATEWATCH_SHARD));
 panel.querySelector('strong')!.textContent=`${household.name} · ${household.faction}`;panel.querySelector<HTMLElement>('.household-lore')!.textContent=householdLore(household,seed);panel.querySelector<HTMLElement>('.chronicle-line')!.textContent=world.realmSocial?.recent.at(-1)??'The ward clerk has no fresh entry yet.';panel.querySelector<HTMLElement>('.social-signal')!.textContent=`WARD SEPARATOR · KIN ${signature.kin} · MARKET ${signature.market} · WATCH ${signature.watch} · GUILD ${signature.guild}`;
}
render();const timer=window.setInterval(render,2000);window.addEventListener('pagehide',()=>window.clearInterval(timer),{once:true});
