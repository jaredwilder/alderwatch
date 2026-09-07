import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState} from '../src/state';
import {beginAction,resolveStrike,WEAPONS} from '../src/combat-rules';
import {characterTitle,ensureSkills,gainSkill,skillTitle} from '../src/skills';

test('skills advance in visible tenths and cap at Grandmaster 100.0',()=>{
 const p=makePlayer('Hunter');const skills=ensureSkills(p);assert.equal(skills.archery,0);
 gainSkill(p,'archery');assert.equal(skills.archery,.1);
 for(let i=0;i<1200;i++)gainSkill(p,'archery');assert.equal(skills.archery,100);
 assert.equal(skillTitle('archery',100),'Grandmaster Bowman');assert.equal(characterTitle(p),'Grandmaster Bowman');
});

test('a real landed bow strike advances Archery and Tactics by 0.1',()=>{
 const w=seedState(),p=makePlayer('Hunter'),target=makePlayer('Warden');w.players[p.id]=p;target.id='target';w.players[target.id]=target;p.position=[0,0,0];p.yaw=0;p.equipped='bow';target.position=[0,0,10];target.health=100;
 assert.ok(beginAction(p,0,'attack').ok);w.tick=Math.ceil(WEAPONS.bow!.impact*60);const out=resolveStrike(w,p,target,true);assert.equal(out.outcome,'hit');assert.equal(p.skills.archery,.1);assert.equal(p.skills.tactics,.1);
});

test('unpracticed characters keep their archetype title',()=>{const p=makePlayer('Warden');ensureSkills(p);assert.equal(characterTitle(p),'Warden of the Far March');});
