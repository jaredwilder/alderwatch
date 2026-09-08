import test from 'node:test';
import assert from 'node:assert/strict';
import {BACKPACK_SLOTS,backpackCapacity} from '../src/backpack-ui';
import {REALM_ENTRY_LABELS} from '../src/loading-experience';
import {makePlayer} from '../src/state';

test('field backpack is a visible forty-stack shell without deleting overflow',()=>{
 const p=makePlayer('Warden');
 for(let i=0;i<45;i++)p.inventory.push({id:'pack-'+i,item:'wood',count:1,quality:1});
 const cap=backpackCapacity(p);
 assert.equal(BACKPACK_SLOTS,40);
 assert.equal(cap.used,p.inventory.length);
 assert.equal(cap.total,40);
 assert.equal(cap.overflow,Math.max(0,p.inventory.length-40));
});

test('realm entry loader covers every expensive entry action',()=>{
 for(const label of ['CONTINUE','ENTER THE MARCH','START A NEW REALM','RETURN NEAR HOME','RETURN TO ALDERBROOK ROAD'])assert.equal(REALM_ENTRY_LABELS.has(label),true,label);
});
