import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PLAYER_CHAT_CHAOS_ADDENDUM,NPC_CHAT_CHAOS_ADDENDUM} from '../src/chat-bank-chaos-addendum';

const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('parallel chat-bank work is recovered as an additive bank',()=>{
 assert.ok(PLAYER_CHAT_CHAOS_ADDENDUM.kestrel.includes('whoever aggroed that bear owes me rent'));
 assert.ok(PLAYER_CHAT_CHAOS_ADDENDUM.quietfox.length>=20);
 assert.ok(NPC_CHAT_CHAOS_ADDENDUM.mara.includes('If ToastMerchant comes in here, tell him I died.'));
 assert.equal(Object.keys(NPC_CHAT_CHAOS_ADDENDUM).length,9);
 const runtime=source('src/runtime-extensions.ts');
 assert.ok(runtime.indexOf("import './chat-bank-expansion';")<runtime.indexOf("import './chat-bank-chaos-addendum';"),'recovered addendum must layer after the current main conversation bank');
});

test('HD bark no longer disables observer normal and roughness bands',()=>{
 const bark=source('src/tree-bark-hd.ts');
 assert.doesNotMatch(bark,/normalMap\s*=\s*null/);
 assert.doesNotMatch(bark,/roughnessMap\s*=\s*null/);
 assert.match(bark,/if\(material\.normalMap\)/);
 const natural=source('src/natural-detail-runtime.ts');
 assert.match(natural,/#ifdef USE_NORMALMAP/);
 assert.match(natural,/defined\(USE_ROUGHNESSMAP\)/);
});

test('recent runtime bootstrap still composes all critical feature layers',()=>{
 const boot=source('src/bootstrap.ts'),runtime=source('src/runtime-extensions.ts');
 for(const feature of ['./dev-tools','./realm-route-surfacing','./area-realm-chat','./natural-detail-runtime','./visual-detail-overdrive','./tree-bark-hd'])assert.match(boot,new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 for(const feature of ['./simulated-players','./simulated-player-society','./realm-chat-network','./chat-bank-expansion','./backpack-ui','./world-boss-runtime'])assert.match(runtime,new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
