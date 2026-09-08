import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const source=(path:string)=>readFileSync(path,'utf8');

test('Far March installs core player UI before optional runtime extensions',()=>{
 const bootstrap=source('src/bootstrap.ts');
 const main=bootstrap.indexOf("await import('./main')");
 const essential=bootstrap.indexOf('await installFarMarchPlayerUI()');
 const runtime=bootstrap.indexOf("await import('./runtime-extensions')");
 assert.ok(main>=0,'Far March must load main');
 assert.ok(essential>main,'core player UI must install after GamePanels/main exists');
 assert.ok(runtime>essential,'optional runtime extensions must not gate core player UI');
 for(const id of ['./ui-stack','./backpack-ui','./item-icons-module','./recipe-book-ui'])assert.ok(bootstrap.includes(`import('${id}')`),`${id} must be an independently protected core UI import`);
 assert.ok(source('src/item-icons-module.ts').includes("import './item-icons'"),'item icon wrapper must install the existing side-effect icon system');
 assert.ok(bootstrap.includes("catch(error){console.error('Alderwatch optional runtime extensions failed to install'"),'optional extension failure must not abort the loaded Far March');
});

test('M is reserved for the live world map instead of generic Journal input',()=>{
 const input=source('src/input.ts'),map=source('src/minimap.ts');
 assert.ok(input.includes("if(e.code==='KeyM')return"),'generic Input must not queue KeyM');
 assert.ok(map.includes("e.code==='KeyM'"),'MiniMap must own KeyM');
 assert.ok(map.includes('this.openWorldMap()'),'MiniMap KeyM path must open the full map');
 assert.ok(map.includes('M: world map · J: journal'),'HUD map contract must remain explicit');
});

test('browser runtime extension imports all resolve to existing source modules',()=>{
 const runtime=source('src/runtime-extensions.ts');
 const imports=[...runtime.matchAll(/import ['"](\.\/[^'"]+)['"]/g)].map(match=>match[1]);
 assert.ok(imports.length>0,'runtime extension bootstrap should contain browser modules');
 for(const specifier of imports){
  const base='src/'+specifier.slice(2);
  assert.ok(existsSync(base+'.ts')||existsSync(base+'.css'),`missing runtime extension target ${specifier}`);
 }
});

test('backpack decorator still matches authoritative inventory markup',()=>{
 const panels=source('src/game-panels.ts'),backpack=source('src/backpack-ui.ts');
 assert.ok(panels.includes("grid.className='pack-grid'"));
 assert.ok(panels.includes("card.className='pack-item'"));
 assert.ok(backpack.includes("querySelector<HTMLElement>('.pack-grid')"));
 assert.ok(backpack.includes("querySelectorAll<HTMLElement>('.pack-item')"));
 assert.ok(backpack.includes('installBackpackUI()'));
});
