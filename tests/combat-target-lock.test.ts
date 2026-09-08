import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {Combat} from '../src/combat';
import {Soundscape} from '../src/audio';
import {LocalAuthority,makePlayer,seedState,type EnemyState} from '../src/state';
import {beginAction,seedEnemies} from '../src/combat-rules';
import {model} from './load-assets';

test('soft target locks for the committed swing and never hops at impact',async()=>{
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0}),root=new T.Group(),state=seedState(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped='sword';state.players[p.id]=p;seedEnemies(state);
 const front=state.enemies['raider-camp-sentry'];front.position=[.12,.02,1.55];front.home=[...front.position];front.health=88;front.maxHealth=88;
 const side:EnemyState={id:'side-raider',name:'Side raider',position:[1.05,.02,.55],yaw:Math.PI,home:[1.05,.02,.55],health:88,maxHealth:88,stamina:100,equipped:'sword',phase:'circle',decisionAt:0,rewarded:false};state.enemies[side.id]=side;
 const authority=new LocalAuthority(state),actor=new Character(assets,physics,p,root);actor.getTick=()=>state.tick;const combat=new Combat(root,assets,physics,authority,actor,new Soundscape());
 const selected=combat.target(2.65);assert.equal(selected?.id,front.id,'Angle-aware selection should prefer the target in the attack line');
 assert.equal(beginAction(p,state.tick,'attack').ok,true);
 side.position=[.02,.02,1.1];front.position=[.2,.02,1.7];const locked=combat.target(2.8);assert.equal(locked?.id,front.id,'Committed swing hopped to a newly better target');
 front.health=0;assert.equal(combat.target(2.8),undefined,'A dead locked target should cause a miss, not a mid-swing retarget');
 physics.free();
});
