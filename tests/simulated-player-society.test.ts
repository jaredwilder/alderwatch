import test from 'node:test';
import assert from 'node:assert/strict';
import {chatAffinityDelta,shouldCooperate,socialTone} from '../src/simulated-player-society';

test('social tone crosses meaningful persistent relationship bands',()=>{
 assert.equal(socialTone(-8),'nemesis');
 assert.equal(socialTone(-3),'hostile');
 assert.equal(socialTone(0),'wary');
 assert.equal(socialTone(2),'neutral');
 assert.equal(socialTone(5),'friend');
 assert.equal(socialTone(9),'ride-or-die');
});

test('ordinary chat can move affinity without giant one-message swings',()=>{
 assert.ok(chatAffinityDelta('ty legend good job')>0);
 assert.ok(chatAffinityDelta('you are useless garbage')<0);
 assert.ok(chatAffinityDelta('wolf west')===0);
 assert.ok(chatAffinityDelta('fuck you idiot')>=-1.5);
});

test('hostile bots can refuse while strong friends reliably cooperate',()=>{
 for(let seed=0;seed<12;seed++)assert.equal(shouldCooperate(6,seed),true);
 const hostile=Array.from({length:15},(_,seed)=>shouldCooperate(-6,seed));
 assert.ok(hostile.some(Boolean));
 assert.ok(hostile.some(v=>!v));
});
