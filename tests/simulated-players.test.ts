import test from 'node:test';
import assert from 'node:assert/strict';
import {inferPlayerBotIntent,parsePlayerBotReply} from '../src/simulated-players';

test('player chat intents map ordinary multiplayer language to bounded actions',()=>{
 assert.equal(inferPlayerBotIntent('yo @kestrel follow me'),'follow');
 assert.equal(inferPlayerBotIntent('mira come here a sec'),'come');
 assert.equal(inferPlayerBotIntent('stay here while i scout'),'stay');
 assert.equal(inferPlayerBotIntent('help me build a base'),'build');
 assert.equal(inferPlayerBotIntent('yeah build right here'),'build_here');
 assert.equal(inferPlayerBotIntent('go do your thing'),'wander');
 assert.equal(inferPlayerBotIntent('lol that deer is broken'),'none');
});

test('hidden OpenRouter action markers never leak into realm chat',()=>{
 assert.deepEqual(parsePlayerBotReply('yeah dude lead [[AW_ACTION:FOLLOW]]'),{text:'yeah dude lead',action:'follow'});
 assert.deepEqual(parsePlayerBotReply('this spot works\n[[AW_ACTION:BUILD_HERE]]'),{text:'this spot works',action:'build_here'});
 assert.deepEqual(parsePlayerBotReply('nah lol'),{text:'nah lol',action:'none'});
});

test('unknown action markers cannot acquire game authority',()=>{
 const parsed=parsePlayerBotReply('sure [[AW_ACTION:SPAWN_GOLD]]');
 assert.equal(parsed.action,'none');
 assert.equal(parsed.text,'sure [[AW_ACTION:SPAWN_GOLD]]');
});
