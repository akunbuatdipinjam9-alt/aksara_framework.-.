'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
global.AksaraRuntime=require('../runtime.js');
const A=require('../compiler.js');
assert.equal(A.version,require('../package.json').version);
const source=fs.readFileSync(path.join(__dirname,'../examples/kalkulator-v52.aks'),'utf8');
const compiled=A.compile(source,{strict:true});
assert.deepEqual(compiled.diagnostics.filter(x=>x.severity==='error'),[],JSON.stringify(compiled.diagnostics));
assert.match(compiled.javascript,/__rt\.numberField\("Angka pertama"\)/);
assert.match(compiled.javascript,/__rt\.numberValue\("Angka pertama"\)/);
assert.equal(A.compile('gunakan web\nbuat masukan "Nama"').diagnostics.filter(x=>x.severity==='error').length,0);
assert.equal(A.compile('gunakan web\nbuat masukan angka "Nilai"').diagnostics.filter(x=>x.severity==='error').length,0);
assert.equal(A.compile('gunakan web\ntampilkan web_angka("Nilai")',{strict:true}).diagnostics.filter(x=>x.severity==='error').length,0);
// Minimal browser DOM harness: exercise actual runtime, not just emitted JS.
const inputs=new Map();const headings=[];const buttons=new Map();
function element(tag){return {tagName:tag,value:'',style:{setProperty(){}},dataset:{},children:[],listeners:{},append(...xs){this.children.push(...xs)},addEventListener(type,fn){this.listeners[type]=fn},setAttribute(){},dispatchEvent(e){if(this.listeners[e.type])this.listeners[e.type]()},set textContent(v){this._text=String(v)},get textContent(){return this._text||''}}}
const root=element('div');root.style.backgroundColor='';root.querySelector=selector=>selector==='h2'?headings[0]:null;
global.document={body:root,title:'',getElementById:id=>id==='aksara-root'?root:null,createElement:tag=>{const el=element(tag);if(tag==='h2')headings.push(el);if(tag==='input'){Object.defineProperty(el,'placeholder',{set(v){inputs.set(v,this)},get(){return this._placeholder}})}if(tag==='button'){Object.defineProperty(el,'textContent',{set(v){this._text=v;buttons.set(v,this)},get(){return this._text||''}})}return el}};
global.Event=class{constructor(type){this.type=type}};
const messages=[];global.__AKSARA_HOST__={send:(type,value)=>messages.push({type,value})};
(async()=>{
 eval(compiled.javascript);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(inputs.get('Angka pertama').type,'number');
 assert.equal(inputs.get('Angka kedua').type,'number');
 assert.equal(buttons.size,4);
 const click=async name=>buttons.get(name).listeners.click();
 inputs.get('Angka pertama').value='12';inputs.get('Angka kedua').value='4';
 for(const [op,expected] of [['Tambah','Hasil: 16'],['Kurang','Hasil: 8'],['Kali','Hasil: 48'],['Bagi','Hasil: 3']]){await click(op);assert.equal(headings[0].textContent,expected,op)}
 inputs.get('Angka kedua').value='0';await click('Bagi');assert.equal(headings[0].textContent,'Tidak bisa dibagi nol!');
 inputs.get('Angka pertama').value='';await click('Tambah');assert.ok(messages.some(x=>x.type==='error'&&String(x.value).includes('masih kosong')));
 console.log('v5.2: numeric inputs, 4 operations, zero division, empty validation and strict compiler passed');
})().catch(e=>{console.error(e);process.exitCode=1});
