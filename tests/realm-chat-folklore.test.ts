import test from 'node:test';
import assert from 'node:assert/strict';
import type {HistoricalAtom} from '../src/provenance-frontier';
import {classifyRealmFolkloreAtom,rankRealmFolklore,realmFolkloreFromAtom,realmFolkloreImportance,realmFolkloreTitle} from '../src/realm-chat-folklore';

function atom(overrides:Partial<HistoricalAtom>={}):HistoricalAtom{return {id:'hist:1:1:test',day:1,kind:'deed',ward:0,subjects:['human'],parents:[],summary:'Player did something consequential.',source:'player',actorId:'human',actorName:'Player',channel:'watch',...overrides};}

test('only salient deeds become folklore instead of turning every notification into a legend',()=>{
 assert.equal(classifyRealmFolkloreAtom(atom({summary:'Player raised wall in the Far March; the construction entered the realm record.',channel:'guild'})),undefined);
 assert.equal(classifyRealmFolkloreAtom(atom({summary:'Player completed iron fittings at the work station; guild talk carried the result outward.',channel:'guild'})),undefined);
 assert.equal(classifyRealmFolkloreAtom(atom({subjects:['human','folklore:construction-spree'],summary:'Player raised four structures inside two minutes.'})),'construction-spree');
});

test('physical folklore markers outrank prose inference and preserve the exact incident kind',()=>{
 const marked=atom({subjects:['human','folklore:bear-escape'],summary:'Player came out of a bear encounter after health fell to 17.'});
 assert.equal(classifyRealmFolkloreAtom(marked),'bear-escape');
 assert.equal(realmFolkloreImportance(marked),13);
});

test('chat statements about danger do not masquerade as physical server history',()=>{
 const statement=atom({summary:'Player: “bear north” — the statement became consequential enough to enter realm memory.'});
 assert.equal(classifyRealmFolkloreAtom(statement),undefined);
});

test('boss kills can become immediate stories while ordinary kills wait for a real streak',()=>{
 const ordinary=atom({summary:'Player killed Raider. The death entered watch reports and can now survive as realm history.'});
 const boss=atom({id:'hist:1:2:test',summary:'Player killed Captain Rusk. The death entered watch reports and can now survive as realm history.'});
 assert.equal(classifyRealmFolkloreAtom(ordinary),'watch-kill');
 assert.equal(realmFolkloreImportance(ordinary),7);
 assert.equal(realmFolkloreImportance(boss),11);
});

test('folklore names are stable functions of world seed plus canonical atom identity',()=>{
 const captain=atom({id:'hist:4:9:captain',summary:'Player killed Captain Rusk. The death entered watch reports and can now survive as realm history.'});
 const first=realmFolkloreTitle(197709,captain),second=realmFolkloreTitle(197709,captain);
 assert.equal(first,second);
 assert.match(first??'',/Captain Rusk/);
 assert.equal(realmFolkloreFromAtom(197709,captain)?.title,first);
});

test('rare finds receive authored commodity memes rather than generic generated names',()=>{
 const truffle=atom({summary:'Player found a black truffle; the unusually good find became market gossip.',channel:'market'});
 const honey=atom({id:'hist:2:2:honey',summary:'Player found wild honey; the unusually good find became market gossip.',channel:'market'});
 assert.equal(realmFolkloreTitle(1,truffle),'The Truffle Bubble');
 assert.equal(realmFolkloreTitle(1,honey),'The Honey Economy');
});

test('ranking puts genuinely catastrophic player incidents above background realm gossip',()=>{
 const down=atom({id:'hist:5:1:down',subjects:['human','folklore:wolf-down'],summary:'Player fell during a wolf-pack encounter.'});
 const succession=atom({id:'hist:5:2:seal',kind:'succession',source:'world',actorId:undefined,actorName:undefined,summary:'A household took the Free Traders seal.'});
 const ranked=rankRealmFolklore(88,[succession,down]);
 assert.equal(ranked[0]?.kind,'wolf-down');
 assert.equal(ranked[1]?.kind,'realm-succession');
});