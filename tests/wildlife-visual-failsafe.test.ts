import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AUTHORED_ANIMAL_SET,LEGACY_ANIMAL_FALLBACK_SET,WILDLIFE_SPECIES} from '../src/wildlife-species';

test('hare crow and sheep are immediate-visible fallbacks that still upgrade to authored models',()=>{
  for(const kind of ['hare','crow','sheep'] as const){
    assert.equal(WILDLIFE_SPECIES[kind].authored,true,`${kind} must attempt its authored GLB`);
    assert.equal(AUTHORED_ANIMAL_SET.has(kind),true,`${kind} must stay in the authored upgrade set`);
    assert.equal(LEGACY_ANIMAL_FALLBACK_SET.has(kind),true,`${kind} must remain visible while the GLB loads or fails`);
  }
});

test('one broken authored animal cannot reject the entire wildlife visual library',()=>{
  const source=readFileSync(new URL('../src/animal-models.ts',import.meta.url),'utf8');
  assert.match(source,/Partial<Record<AuthoredAnimalKind,GLTF>>/);
  assert.match(source,/AUTHORED_ANIMAL_KINDS\.map\(async kind=>\{\s*try\{/s);
  assert.match(source,/catch\(error\).*keeping its fallback when available/s);
});

test('Nature hot-swaps successful authored models without sacrificing synchronous fallbacks',()=>{
  const source=readFileSync(new URL('../src/nature.ts',import.meta.url),'utf8');
  assert.match(source,/!AUTHORED_ANIMAL_SET\.has\(a\.kind\)\|\|LEGACY_ANIMAL_FALLBACK_SET\.has\(a\.kind\)/);
  assert.match(source,/const fallback=this\.animals\.get\(a\.id\);if\(fallback\).*fallback\.group\.removeFromParent\(\)/s);
  assert.match(source,/authored:false/);
  assert.match(source,/authored:true/);
});