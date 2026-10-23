'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Runtime=require('../runtime.js');
global.AksaraRuntime=Runtime;
const A=require('../compiler.js');
class Element {
  constructor(tag){this.tag=tag;this.dataset={};this.style={setProperty(){}};this.children=[];this.listeners={};this.parent=null;this._text='';this.classList={add(){}}}
  get isConnected(){return this===global.document.body||this===global.document.head||!!this.parent?.isConnected}
  get textContent(){return this._text+this.children.map(x=>x.textContent).join('')}
  set textContent(value){this.replaceChildren();this._text=String(value)}
  append(...elements){for(const el of elements){el.parent=this;this.children.push(el)}}
  replaceChildren(...elements){for(const e of this.children)e.parent=null;this.children=[];this._text='';this.append(...elements)}
  contains(el){return this===el||this.children.some(x=>x.contains(el))}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
  setAttribute(key,val){this[key]=val}
  getAttribute(key){return this[key]||null}
  querySelectorAll(selector){let out=[];for(const ch of this.children){if(selector.split(',').includes(ch.tag))out.push(ch);out.push(...ch.querySelectorAll(selector))}return out}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
}
const body=new Element('body'),head=new Element('head');
global.document={body,head,title:'',createElement:tag=>new Element(tag),getElementById:id=>id==='aksara-root'?body:null,querySelector:query=>{
 const m=/style\[data-aksara-(style|media)="([^"]+)"\]/.exec(query);
 return m?head.children.find(x=>x.dataset[m[1]==='style'?'aksaraStyle':'aksaraMedia']===m[2])||null:null;
}};
const listeners={};global.addEventListener=(type,fn)=>{(listeners[type]??=[]).push(fn)};
global.location={hash:'#/profil/12'};
const errors=[];global.__AKSARA_HOST__={send:(type,value)=>{if(type==='error')errors.push(value)}};
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../examples/web-framework-v61.aks'),'utf8');
 const c=A.compile(source,{strict:true});assert.deepEqual(c.diagnostics.filter(x=>x.severity==='error'),[],JSON.stringify(c.diagnostics));
 assert.match(c.javascript,/__rt\.mediaRule\(700/);
 const rt=Runtime();rt.enable('web');const browserDb=Runtime();browserDb.enable('database');assert.throws(()=>browserDb.openDatabase('forbidden.db'),/CLI Node/);
 rt.styleRule('layout',{'display':'grid','gap':'4px'});
 const before=head.children.find(x=>x.dataset.aksaraStyle==='layout').textContent;
 rt.mediaRule(700,'layout',{'grid-template-columns':'1fr 1fr'});
 assert.equal(head.children.find(x=>x.dataset.aksaraStyle==='layout').textContent,before,'mediaRule must not overwrite base CSS');
 assert.match(head.children.find(x=>x.dataset.aksaraMedia==='layout').textContent,/@media/);
 assert.throws(()=>rt.styleRule('hack',{'background':'url(javascript:evil)'}),/aman/);
 const state=rt.state(1);rt.component('Counter',props=>rt.text(props.title+': '+state.nilai));
 rt.route('/profil/:id',params=>{rt.title('Profil '+params.id);rt.mountComponent('Counter',{title:'Angka'})});
 rt.route('/profil/edit',()=>rt.title('Edit profil'));
 rt.route('/',()=>rt.title('Beranda'));
 rt.startRouter();
 assert.equal(rt.currentRoute().parameter.id,'12');
 assert.match(body.textContent,/Angka: 1/);
 state.nilai=2;await new Promise(resolve=>setImmediate(resolve));assert.match(body.textContent,/Angka: 2/);
 rt.navigate('/profil/edit');assert.match(body.textContent,/Edit profil/);
 assert.doesNotMatch(body.textContent,/Angka: 2/);
 state.nilai=3;await new Promise(resolve=>setImmediate(resolve));assert.match(body.textContent,/Edit profil/);
 rt.navigate('/');assert.equal(global.location.hash,'#/');
 global.location.hash='#/profil/40';for(const fn of listeners.hashchange||[])fn();assert.equal(rt.currentRoute().parameter.id,'40');
 assert.deepEqual(errors,[]);
 // Run the full compiled Aksara website, not merely the runtime helper API.
 global.location.hash='#/';body.replaceChildren();
 await eval(c.javascript);
 assert.match(body.textContent,/Beranda Aksara/);
 assert.match(body.textContent,/Halo, Akhtar/);
 assert.match(body.textContent,/Halo, Pengunjung/);
 assert.match(body.textContent,/Lihat profil/);
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('v6.1 web: responsive CSS, component props, reactive state, route priority, deep links and hash changes passed');
})().catch(e=>{console.error(e);process.exitCode=1});
