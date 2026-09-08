import test from 'node:test';
import assert from 'node:assert/strict';
import {guardedNegotiationRefusal,mayNegotiate,negotiationIntent,npcRoleplayRegister,relayTrustDelta,standingFromSignals,witnessLine} from '../src/npc-outsider-standing';

test('NPC standing climbs from outsider to ally using earned world signals',()=>{
 assert.equal(standingFromSignals({alderbrook:0,faction:0,fame:0,karma:0,localTrust:0}),'outsider');
 assert.equal(standingFromSignals({alderbrook:8,faction:8,fame:3,karma:2,localTrust:0}),'known');
 assert.equal(standingFromSignals({alderbrook:18,faction:18,fame:12,karma:5,localTrust:0}),'trusted');
 assert.equal(standingFromSignals({alderbrook:38,faction:30,fame:24,karma:8,localTrust:0}),'negotiator');
 assert.equal(standingFromSignals({alderbrook:60,faction:55,fame:45,karma:15,localTrust:0}),'ally');
});

test('negotiation rights stay gated behind standing',()=>{
 assert.equal(mayNegotiate('outsider'),false);
 assert.equal(mayNegotiate('trusted'),false);
 assert.equal(mayNegotiate('negotiator'),true);
 assert.equal(negotiationIntent('Could we discuss better price terms?'),true);
 assert.equal(negotiationIntent('Any wolves north?'),false);
});

test('NPC relay register keeps formal capitalization and punctuation',()=>{
 assert.equal(npcRoleplayRegister('road prices are up again. blame wolves'),'Road prices are up again. Blame wolves.');
 assert.equal(npcRoleplayRegister('i dont know'),"I don't know.");
 assert.equal(npcRoleplayRegister('Already proper.'),'Already proper.');
});

test('relay etiquette only nudges local trust around gameplay reputation',()=>{
 assert.ok(relayTrustDelta('Good day. Thank you for your help.')>0);
 assert.ok(relayTrustDelta('shut up you idiot')<0);
 assert.equal(relayTrustDelta('Any news from the road?'),0);
});

test('witnesses visibly distinguish outsiders from trusted speakers',()=>{
 assert.match(witnessLine('outsider','Mara','Rurik',0),/outsider/i);
 assert.match(witnessLine('trusted','Mara','Rurik',0),/vouch|earned|weight/i);
 assert.match(guardedNegotiationRefusal('Wanderer','known'),/greater standing/i);
});
