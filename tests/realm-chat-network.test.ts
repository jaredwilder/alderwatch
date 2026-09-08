import test from 'node:test';
import assert from 'node:assert/strict';
import {npcSignalKind,pickNpcChannelTarget,playerChatNoise} from '../src/realm-chat-network';

test('player chat noise is personality weighted instead of universal fake typos',()=>{
 assert.equal(playerChatNoise('LagGoblin','actually probably something',0),'acutally probably something');
 assert.equal(playerChatNoise('Kestrel','actually probably something',99),'actually probably something');
 assert.equal(playerChatNoise('quietfox','bear west',0),'bear west');
});

test('NPC channel classifies consequential rumor signals',()=>{
 assert.equal(npcSignalKind('Mara is buying hide today','trade'),'trade');
 assert.equal(npcSignalKind('bear tracks north of the road'),'danger');
 assert.equal(npcSignalKind('that roof beam is crooked'),'build');
 assert.equal(npcSignalKind('crow milk beta cohort'),'weird');
 assert.equal(npcSignalKind('we need to discuss your recent behavior','beef'),'beef');
});

test('NPC global chat routes mentions and topic messages to fitting townsfolk',()=>{
 assert.equal(pickNpcChannelTarget('@Mara anyone buying wood?',3),'mara');
 assert.equal(pickNpcChannelTarget('need help with my roof',3),'sigrid');
 assert.equal(pickNpcChannelTarget('heard a bear north',3),'ylva');
 assert.equal(pickNpcChannelTarget('tell me something weird',3),'moss');
});
