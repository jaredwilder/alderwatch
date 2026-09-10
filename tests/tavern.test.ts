import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAVERN_DRINKS,MAX_INTOXICATION,addIntoxication,sober,tavernMoveScale,tavernCameraSway,scoreAlderbones,resolveAlderbones} from '../src/tavern-rules';

test('The Tipsy Alder has three distinct drinks and intoxication stays bounded',()=>{
 assert.deepEqual(TAVERN_DRINKS.map(d=>d.name),['Alder Brown','Bee-Stung Cider','Crow’s Regret']);
 let level=0;for(let i=0;i<20;i++)level=addIntoxication(level,'crows_regret');assert.equal(level,MAX_INTOXICATION);
 assert.ok(sober(level,30)<level);assert.equal(sober(.1,30),0);
 assert.ok(tavernMoveScale(MAX_INTOXICATION)>=.88,'drinking may add wobble but must not make movement miserable');
});

test('intoxication camera effect is deterministic and exactly absent while sober',()=>{
 assert.deepEqual(tavernCameraSway(0,12.3),{yaw:0,pitch:0});
 assert.deepEqual(tavernCameraSway(3,12.3),tavernCameraSway(3,12.3));
 assert.notEqual(tavernCameraSway(3,12.3).yaw,0);
});

test('Alderbones rewards pairs and the house really does take ties',()=>{
 assert.equal(scoreAlderbones([4,4]).score,15);assert.equal(scoreAlderbones([6,5]).score,11);
 assert.equal(resolveAlderbones([6,6],[6,5]).winner,'player');
 assert.equal(resolveAlderbones([3,4],[2,5]).winner,'house');
 assert.throws(()=>scoreAlderbones([0,9]));
});

test('tavern source is a real enterable 3D gameplay room, not a dialogue-only facade',()=>{
 const source=readFileSync(new URL('../src/alderbrook-tavern.ts',import.meta.url),'utf8');
 for(const contract of ['The Tipsy Alder','Brinna Keggs','isolated interior capsule','RAPIER.ColliderDesc','InstancedMesh','campfire_burning_q','Alderbones','house pipe','safeSavePosition'])assert.ok(source.includes(contract),`missing tavern contract: ${contract}`);
 const bridge=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 for(const contract of ['Character.prototype.postStep','Character.prototype.preStep','setTranslation','tavern:enter','tavern:exit','openBar','openBones'])assert.ok(bridge.includes(contract),`missing live integration: ${contract}`);
});

test('live Alderbrook porch is the enter target instead of one buried magic point',()=>{
 const bridge=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 assert.match(bridge,/const PORCH=\{minX:-13\.25,maxX:-6\.35,minZ:-31\.15,maxZ:-25\.55\}/);
 assert.match(bridge,/atTavernPorch\(live\)\?\{kind:'enter'\}/,'outside interaction must use the visible porch footprint');
 assert.match(bridge,/tavern\.inside\?physicalPosition\(position\):position/,'outside must trust PlayerState; physical-body fallback is only needed inside');
 assert.match(bridge,/currentCharacter=this;/,'preStep must refresh the current character before any later interaction frame');
 // Landscape longhouse door positions from x=-9,z=-34,yaw=.1 must sit inside the porch box.
 const doors=[[-10.5905414639,-29.4183215028],[-9.0980352160,-29.5680716278]];
 for(const [x,z] of doors)assert.ok(x>=-13.25&&x<=-6.35&&z>=-31.15&&z<=-25.55,`door ${x},${z} escaped tavern porch`);
});

test('tavern frontage exists before the visible Alderbrook road approach reaches it',()=>{
 const bridge=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 assert.match(bridge,/const DISCOVERY_RADIUS=180;/,'frontage discovery radius must cover the visible downtown approach');
 assert.match(bridge,/const PREWARM_RADIUS=220;/,'prewarm should begin before the tavern enters discovery range');
 assert.match(bridge,/atTavernPorch\(position\)\|\|nearTavern\(position,DISCOVERY_RADIUS\)/,'visible-range construction must be synchronous, not idle-only');
 const approach:[number,number]=[-76.8,89.0],centre:[number,number]=[-9.3,-29.4];
 const distance=Math.hypot(approach[0]-centre[0],approach[1]-centre[1]);
 assert.ok(distance>48,'fixture must prove the old 48m gate would hide the tavern');
 assert.ok(distance<180,'the live downtown approach must construct the tavern before it is visually discoverable');
});

test('second-pass isolation kills the old global prompt and world-overlap regressions',()=>{
 const source=readFileSync(new URL('../src/alderbrook-tavern.ts',import.meta.url),'utf8');
 assert.ok(!source.includes('new T.Vector3(620,20,620)'),'old pseudo-off-map coordinate collided with the expanded realm');
 assert.ok(source.includes('new T.Vector3(EXTERIOR_X,3000,EXTERIOR_Z)'),'interior must live on its dedicated high-altitude layer');
 assert.ok(source.includes('root.visible=false')&&source.includes('this.interiorRoot.visible=true')&&source.includes('this.interiorRoot.visible=false'),'interior render tree must only exist visually while occupied');
 assert.ok(source.includes('Structural shell is intentionally primitive and watertight'),'authored modular wall orientation must not be load-bearing');
 const bridge=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 assert.ok(!bridge.includes("actualPosition(tavern.exteriorDoor));\n if(action)"),'old global-enter prompt rewrite must stay dead');
 assert.ok(bridge.includes('prompt.hidden=!text'),'inside must explicitly suppress leaked outdoor prompts when no tavern affordance is nearby');
 assert.ok(bridge.includes("document.querySelector('.world-boss-entry')?.remove()"),'entering a social interior must clear stale boss spectacle');
});

test('tavern interactions do not pollute or fall through to the outdoor Alderbrook persona roster',()=>{
 const source=readFileSync(new URL('../src/npc.ts',import.meta.url),'utf8');
 assert.ok(source.includes('TavernBridge'));assert.ok(source.includes('kept out of VILLAGERS'));
 assert.ok(source.includes('if(this.tavern.inside)return undefined'),'indoor interaction namespace must not fall through to outdoor villagers');
 assert.ok(source.includes('this.tavern.update(dt,position);if(this.tavern.inside)return'),'outdoor villager ambience should not run while the interior owns the scene');
});
