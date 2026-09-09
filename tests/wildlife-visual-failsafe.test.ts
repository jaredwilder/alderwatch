import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTHORED_ANIMAL_SET,WILDLIFE_SPECIES} from '../src/wildlife-species';

test('starter wildlife keeps synchronous visuals if the authored animal bundle fails',()=>{
  assert.equal(WILDLIFE_SPECIES.hare.authored,false);
  assert.equal(WILDLIFE_SPECIES.crow.authored,false);
  assert.equal(AUTHORED_ANIMAL_SET.has('hare'),false);
  assert.equal(AUTHORED_ANIMAL_SET.has('crow'),false);
});
