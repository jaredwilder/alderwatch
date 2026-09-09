import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addItem,makePlayer,quantity,seedState} from '../src/state';
import {greyhavenProvisionerHousehold,greyhavenProvisionQuote,nearGreyhavenProvisioner,useGreyhavenProvisioner} from '../src/crownroad-services';
import {applyRealmConsequences,householdTrustForActor} from '../src/realm-consequences';
import {promoteCanonicalEvent} from '../src/provenance-frontier';

const liveVale=readFileSync(new URL('../src/crownroad-vale.ts',import.meta.url),'utf8');
function worldWithPlayer(){const world=seedState(),player=makePlayer('Artisan');world.players[player.id]=player;return {world,player};}

test('Greyhaven provisioner is a real bounded world-space service',()=>{
 assert.equal(nearGreyhavenProvisioner(11,-4),true);
 assert.equal(nearGreyhavenProvisioner(20,-4),false);
 const {world,player}=worldWithPlayer(),quote=greyhavenProvisionQuote(world,player);
 assert.ok(quote.timberCost>=2&&quote.timberCost<=8);
 assert.equal(quote.stewCount,1);
 assert.equal(quote.householdOrdinal,greyhavenProvisionerHousehold(world));
});

test('provisioner barter spends real inventory, grants real food and writes exact household memory',()=>{
 const {world,player}=worldWithPlayer();addItem(world,player,'wood',20);const beforeWood=quantity(player,'wood'),beforeStew=quantity(player,'hearty_stew'),house=greyhavenProvisionerHousehold(world),quote=greyhavenProvisionQuote(world,player),out=useGreyhavenProvisioner(world,player);
 assert.equal(out.ok,true);assert.equal(quantity(player,'wood'),beforeWood-quote.timberCost);assert.equal(quantity(player,'hearty_stew'),beforeStew+quote.stewCount);assert.ok(householdTrustForActor(world,house,player.id)>0);
});

test('exact household reputation improves the next Greyhaven deal',()=>{
 const {world,player}=worldWithPlayer(),house=greyhavenProvisionerHousehold(world),base=greyhavenProvisionQuote(world,player);
 for(let i=0;i<5;i++)promoteCanonicalEvent(world,{source:'player',actorId:player.id,actorName:player.name,ward:base.ward,channel:'kin',externalKey:`aid-house-${i}`,subjects:[`house:${house}`],summary:`${player.name} rescued and helped members of House ${house} during a road emergency.`});
 applyRealmConsequences(world);const favored=greyhavenProvisionQuote(world,player);
 assert.ok(favored.householdTrust>base.householdTrust);assert.ok(favored.timberCost<=base.timberCost);assert.equal(favored.standing,'favored');assert.equal(favored.stewCount,2);
});

test('market strain can raise the barter ask without erasing household memory',()=>{
 const {world,player}=worldWithPlayer(),base=greyhavenProvisionQuote(world,player);
 for(let i=0;i<4;i++)promoteCanonicalEvent(world,{source:'world',actorId:'greyhaven-market',actorName:'Greyhaven market',ward:base.ward,channel:'market',externalKey:`market-strain-${i}`,summary:'Greyhaven market shortages tightened local provisioning and raised demand.'});
 applyRealmConsequences(world);const strained=greyhavenProvisionQuote(world,player);
 assert.ok(strained.marketPressure>base.marketPressure);assert.ok(strained.timberCost>=base.timberCost);
});

test('live Crownroad E interaction exposes and executes the causal provisioner service',()=>{
 assert.ok(liveVale.includes('nearGreyhavenProvisioner(p.x,p.z)'));
 assert.ok(liveVale.includes('greyhavenProvisionQuote(authority.state,player)'));
 assert.ok(liveVale.includes('useGreyhavenProvisioner(authority.state,player)'));
 assert.ok(liveVale.includes('Greyhaven provisioner'));
});
