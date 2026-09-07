import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority,makePlayer,quantity} from '../src/state';
import {seedNature} from '../src/nature';

test('wild beehives seed additively as persistent honey forage',()=>{
 const authority=new LocalAuthority();seedNature(authority.state);const hives=Object.values(authority.state.forage).filter(f=>f.kind==='wild_honey');
 assert.equal(hives.length,4);const first=hives[0];first.harvested=true;first.readyAt=1234;seedNature(authority.state);assert.equal(authority.state.forage[first.id].readyAt,1234,'save-owned hive state must not be reset by seeding');
});

test('collecting a hive yields one honey and enforces a long respawn',()=>{
 const authority=new LocalAuthority(),player=makePlayer('Warden');authority.state.players[player.id]=player;seedNature(authority.state);const hive=Object.values(authority.state.forage).find(f=>f.kind==='wild_honey')!;player.position=[...hive.position];
 const out=authority.dispatch({type:'forage',playerId:player.id,forageId:hive.id});assert.equal(out.ok,true);assert.equal(quantity(player,'wild_honey'),1);assert.equal(hive.harvested,true);assert.equal(hive.readyAt,authority.state.tick+60*600);
 assert.equal(authority.dispatch({type:'forage',playerId:player.id,forageId:hive.id}).ok,false,'a stripped hive cannot be spam-farmed');
});

test('wild honey is edible through the normal food authority',()=>{
 const authority=new LocalAuthority(),player=makePlayer('Warden');authority.state.players[player.id]=player;player.health=50;player.inventory.push({id:'test-honey',item:'wild_honey',count:1,quality:1});
 const out=authority.dispatch({type:'eat',playerId:player.id,item:'wild_honey'});assert.equal(out.ok,true);assert.equal(player.health,65);assert.equal(quantity(player,'wild_honey'),0);
});
