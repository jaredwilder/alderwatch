import test from 'node:test';
import assert from 'node:assert/strict';
import {IRONWARD_CROSSING_GATE,isNearIronwardCrossing,parseFarMarchHudPosition} from '../src/far-march-realm-gates';

test('live Far March HUD coordinates parse for realm-gate checks',()=>{
  assert.deepEqual(parseFarMarchHudPosition('Southwood · X 37 · Z 173 · facing 146°'),{x:37,z:173});
  assert.deepEqual(parseFarMarchHudPosition('Ironward Heights | X -12 | Z 5'),{x:-12,z:5});
  assert.equal(parseFarMarchHudPosition('Ironward Heights'),null);
});

test('Ironward Crossing is a physical world-space gate instead of a whole-region trigger',()=>{
  assert.equal(isNearIronwardCrossing(IRONWARD_CROSSING_GATE.x,IRONWARD_CROSSING_GATE.z),true);
  assert.equal(isNearIronwardCrossing(IRONWARD_CROSSING_GATE.x+IRONWARD_CROSSING_GATE.radius,IRONWARD_CROSSING_GATE.z),true);
  assert.equal(isNearIronwardCrossing(IRONWARD_CROSSING_GATE.x+IRONWARD_CROSSING_GATE.radius+1,IRONWARD_CROSSING_GATE.z),false);
});
