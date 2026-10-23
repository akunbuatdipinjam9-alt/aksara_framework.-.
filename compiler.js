'use strict';
/* Aksara 2.5 compiler: token locations, AST, optional semantics and JS generation. */
const Aksara = (() => {
const VERSION='7.0.0-beta.1';
const Diagnostics=typeof AksaraDiagnostics!=='undefined'?AksaraDiagnostics:require('./diagnostics.js');
const Lexer=typeof AksaraLexer!=='undefined'?AksaraLexer:require('./lexer.js');
const Semantics=typeof AksaraSemantic!=='undefined'?AksaraSemantic:require('./semantic.js');
const IDENT=/^[\p{L}_][\p{L}\p{N}_]*$/u;
const forbidden=new Set(['__proto__','prototype','constructor','eval','Function','globalThis','window','document','process','require','module','exports','arguments','__rt','__register','__load','__modules','__cache','__AksaraRuntime','__aksaraMain','induk','await','yield','class','function','let','const','var','default','export','import','while','for','do','return','throw','try','catch','finally','new','delete','void','typeof','instanceof','in','of','switch','case','break','continue','this','super','enum','implements','interface','package','private','protected','public','benar','salah','kosong','diri','baru','tunggu','tidak','true','false','null','undefined','async','extends','static','get','set']);
const safe=(name,line)=>{if(!IDENT.test(name)||name.startsWith("__")||forbidden.has(name))fail(line,`Nama '${name}' tidak diizinkan`);return name;};
const fail=(line,message)=>{const e=new Error(`Baris ${line}: ${message}`);e.line=line;throw e};
function tokenize(text,line){
 return Lexer.expression(text,line);
}
function expr(text,line){const tokens=tokenize(text,line);let at=0;const peek=()=>tokens[at]?.raw;const eat=x=>peek()===x?(at++,true):false;const next=()=>tokens[at++];const expect=x=>{if(!eat(x))fail(line,`Diharapkan '${x}', ditemukan '${peek()??'akhir ekspresi'}'`)};
 function parsePrimary(){let t=next();if(!t)fail(line,'Ekspresi belum lengkap');let node;if(t.raw==='('){node=parse(0);expect(')')}else if(t.raw==='['){const els=[];if(!eat(']')){do{els.push(parse(0))}while(eat(','));expect(']')}node={k:'array',els}}else if(t.raw==='{'){const props=[];if(!eat('}')){do{let key=next();if(!key||!['str','id','num'].includes(key.type))fail(line,'Kunci kamus tidak valid');const name=key.type==='str'?decode(key.raw,line):key.raw;if(['__proto__','prototype','constructor'].includes(String(name)))fail(line,'Kunci kamus dilarang');expect(':');props.push([String(name),parse(0)])}while(eat(','));expect('}')}node={k:'obj',props}}else if(t.type==='str')node=stringExpr(decode(t.raw,line),line);else if(t.type==='num'){const value=Number(t.raw);if(!Number.isFinite(value))fail(line,'Angka di luar batas numerik');node={k:'lit',value}}else if(t.raw==='benar'||t.raw==='salah'||t.raw==='kosong')node={k:'lit',value:t.raw==='benar'?true:t.raw==='salah'?false:null};else if(['-','+','tidak','tunggu'].includes(t.raw))node={k:'unary',op:t.raw,right:parse(10)};else if(t.raw==='baru'){const type=next();if(!type||type.type!=='id')fail(line,'Baru membutuhkan nama kelas');safe(type.raw,line);expect('(');const args=[];if(!eat(')')){do{args.push(parse(0))}while(eat(','));expect(')')}node={k:'new',name:type.raw,args}}else if(t.type==='id'){if(t.raw==='diri')node={k:'self'};else if(t.raw==='induk')node={k:'super'};else {safe(t.raw,line);node={k:'name',name:t.raw}}}else fail(line,`Token '${t.raw}' tidak boleh memulai ekspresi`);
 while(true){if(eat('.')){const prop=next();if(!prop||prop.type!=='id')fail(line,'Nama properti tidak valid');if(['__proto__','prototype','constructor'].includes(prop.raw))fail(line,'Properti dilarang');node={k:'member',base:node,prop:prop.raw};continue}if(eat('[')){const index=parse(0);expect(']');node={k:'index',base:node,index};continue}if(eat('(')){const args=[];if(!eat(')')){do{args.push(parse(0))}while(eat(','));expect(')')}node={k:'call',target:node,args};continue}break}return node}
 const bp={'??':1,'atau':2,'dan':3,'==':4,'!=':4,'>':4,'<':4,'>=':4,'<=':4,'lebih':4,'kurang':4,'sama':4,'minimal':4,'maksimal':4,'dalam':4,'+':5,'-':5,'*':6,'/':6,'%':6,'//':6,'**':8};
 function parse(min){let left=parsePrimary();while(bp[peek()]!==undefined&&bp[peek()]>=min){const token=next().raw;let op=token;if(token==='lebih'||token==='kurang'){expect('dari');op=token==='lebih'?'>':'<'}else if(token==='sama'){expect('dengan');op='=='}else if(token==='minimal')op='>=';else if(token==='maksimal')op='<=';const prec=bp[token];const right=parse(prec+(token==='**'?0:1));left={k:'bin',op,left,right}}return left}
 if(!tokens.length)fail(line,'Ekspresi kosong');const result=parse(0);if(at!==tokens.length)fail(line,`Token berlebih '${peek()}'`);return result}
function decode(s,line){if(s[0]==='"'){try{return JSON.parse(s)}catch{fail(line,'Escape string tidak valid')}}try{return JSON.parse('"'+s.slice(1,-1).replace(/\\'/g,"'").replace(/"/g,'\\"')+'"')}catch{fail(line,'Escape string tidak valid')}}
// Only simple {identifier} placeholders interpolate; doubled braces escape a literal brace.
// JSON snippets such as '{"nama":"Akhtar"}' remain literal strings.
function stringExpr(value,line){
 const parts=[];let literal='';
 for(let i=0;i<value.length;){
  if(value.startsWith('{{',i)){literal+='{';i+=2;continue}
  if(value.startsWith('}}',i)){literal+='}';i+=2;continue}
  if(value[i]==='{'){
   const match=/^\{([\p{L}_][\p{L}\p{N}_]*)\}/u.exec(value.slice(i));
   if(match){if(literal){parts.push(literal);literal=''}parts.push({k:'name',name:safe(match[1],line)});i+=match[0].length;continue}
  }
  literal+=value[i++];
 }
 if(literal)parts.push(literal);
 return parts.some(x=>typeof x==='object')?{k:'interpolate',parts}:{k:'lit',value:parts.join('')};
}
// Desugar simple first-use assignments into declarations within their lexical scope.
// Explicit declarations and parent-scope variables keep the existing behavior.
function simplifyAssignments(nodes,parents=new Set()){
 const visible=new Set(parents);
 // Function and class names can be referenced before their definition.
 for(const n of nodes)if(n.type==='fn'||n.type==='class')visible.add(n.name);
 for(const n of nodes){
  if(n.type==='assign'&&n.shortAssign&&n.target.k==='name'&&!visible.has(n.target.name)){
   const name=n.target.name;
   n.type='declare';n.name=name;n.constant=false;n.typeName=null;delete n.target;
  }
  if(['declare','fn','class'].includes(n.type))visible.add(n.name);
  if(n.type==='import')for(const name of n.names)visible.add(name);
  if(n.type==='smartImport')visible.add(n.alias);
  if(n.type==='fn')simplifyAssignments(n.body,new Set([...visible,...n.args]));
  if(n.type==='test')simplifyAssignments(n.body,new Set(visible));
  if(n.type==='class')for(const met of n.body)simplifyAssignments(met.body,new Set([...visible,...met.args]));
  for(const key of ['yes','no','otherwise','catchBody','finallyBody'])if(Array.isArray(n[key]))simplifyAssignments(n[key],new Set([...visible,...(key==='catchBody'?[n.errorName]:[])]));
  if(n.type==='try')simplifyAssignments(n.body,new Set(visible));
  if(n.type==='event'||n.type==='inputevent')simplifyAssignments(n.body,new Set(visible));
  if(['foreach','forrange','repeat','while'].includes(n.type))simplifyAssignments(n.body,new Set([...visible,...(n.type==='repeat'?['indeks']:n.name?[n.name]:[])]));
  if(n.type==='select')for(const c of n.cases)simplifyAssignments(c.body,new Set(visible));
 }
 return nodes;
}
function assignmentTarget(raw,line){const node=expr(raw,line);if(!['name','member','index'].includes(node.k))fail(line,'Target perubahan harus variabel atau properti');return node}
function linesOf(source){
 const raw=source.replace(/\r\n?/g,'\n').split('\n');const result=[];
 let buffer='',first=1,depth=0,quote=null,escaped=false;
 for(let i=0;i<raw.length;i++){
   let clean='';const line=raw[i];
   for(const c of line){
     if(quote){clean+=c;if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote=null;continue}
     if(c==='#')break;
     clean+=c;
     if(c==='"'||c==="'"){quote=c;continue}
     if('([{'.includes(c))depth++;
     else if(')]}'.includes(c))depth--;
   }
   if(quote)fail(i+1,'String tidak boleh melintasi baris');
   if(depth<0)fail(i+1,'Tanda kurung penutup berlebihan');
   if(!buffer)first=i+1;
   buffer+=(buffer?' ':'')+clean.trim();
   if(depth===0&&!quote){const trimmed=buffer.trim();if(trimmed)result.push({s:trimmed,n:first});buffer=''}
 }
 if(quote)fail(first,'String belum ditutup');
 if(depth!==0)fail(first,'Daftar, kamus, atau kurung belum ditutup');
 return result;
}
function isAssignment(s){let quote=null,escaped=false;for(let i=0;i<s.length;i++){const ch=s[i];if(quote){if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch===quote)quote=null;continue}if(ch==='"'||ch==="'"){quote=ch;continue}if(ch==='='&&s[i-1]!=='='&&s[i-1]!=='!'&&s[i-1]!=='<'&&s[i-1]!=='>'&&s[i+1]!=='=')return true;}return false}
function parseSource(source){const lines=linesOf(source);let pos=0;function block(nested=false,switchMode=false){const out=[];while(pos<lines.length){const {s,n}=lines[pos++];if(s==='selesai'||s==='jika tidak'||/^atau jika .+ maka$/.test(s)||s==='tangkap'||s==='akhirnya'||(switchMode&&(s==='lainnya'||/^kasus .+$/.test(s)))){if(!nested)fail(n,`'${s}' tanpa pembuka`);return {nodes:out,term:s,line:n}}let m,exported=false;let line=s;if(line.startsWith('ekspor ')){exported=true;line=line.slice(7).trim()}
 const push=node=>out.push({...node,n,exported});const nestedBlock=(label,terms=['selesai'])=>{const b=block(true);if(!terms.includes(b.term)&&!(terms.includes('atau jika')&&/^atau jika .+ maka$/.test(b.term||'')))fail(n,`Blok ${label} belum ditutup dengan selesai`);return b};
 const ifTail=(term,line)=>{if(term==='selesai')return [];if(term==='jika tidak')return nestedBlock('jika tidak').nodes;const hit=/^atau jika (.+) maka$/.exec(term||'');if(!hit)fail(line,'Cabang kondisi tidak dikenali');const part=nestedBlock('atau jika',['selesai','jika tidak','atau jika']);return [{type:'if',n:line,cond:expr(hit[1],line),yes:part.nodes,no:ifTail(part.term,part.line)}]};
 if((m=/^(ingat|tetap) ([\p{L}_][\p{L}\p{N}_]*)(?::\s*([\p{L}_][\p{L}\p{N}_]*))? sebagai (.+)$/u.exec(line))){push({type:'declare',constant:m[1]==='tetap',name:safe(m[2],n),typeName:m[3]||null,value:expr(m[4],n)})}
 else if((m=/^ubah judul menjadi (.+)$/.exec(line)))push({type:'web',method:'changeTitle',args:[expr(m[1],n)]});
 else if((m=/^ubah teks (.+) menjadi (.+)$/.exec(line)))push({type:'web',method:'setText',args:[expr(m[1],n),expr(m[2],n)]});
 else if((m=/^ubah (.+) menjadi (.+)$/.exec(line))){push({type:'assign',target:assignmentTarget(m[1],n),value:expr(m[2],n)})}
 else if((m=/^(.+?)\s*=\s*(.+)$/.exec(line))&&isAssignment(line)){push({type:'assign',shortAssign:true,target:assignmentTarget(m[1],n),value:expr(m[2],n)})}
 else if((m=/^tampilkan (.+)$/.exec(line)))push({type:'print',value:expr(m[1],n)});
 else if((m=/^kembalikan(?: (.+))?$/.exec(line)))push({type:'return',value:m[1]?expr(m[1],n):{k:'lit',value:null}});
 else if((m=/^lempar (.+)$/.exec(line)))push({type:'throw',value:expr(m[1],n)});
 else if((m=/^jika (.+) maka$/.exec(line))){const yes=nestedBlock('jika',['selesai','jika tidak','atau jika']);const no=ifTail(yes.term,yes.line);push({type:'if',cond:expr(m[1],n),yes:yes.nodes,no})}
 else if((m=/^uji (.+)$/.exec(line))){push({type:'test',label:expr(m[1],n),body:nestedBlock('uji').nodes})}
 else if((m=/^pilih (.+)$/.exec(line))){
   const value=expr(m[1],n),cases=[];let fallback=[],part=block(true,true);
   if(part.nodes.length)fail(n,'Blok pilih harus dimulai dengan kasus atau lainnya');
   if(!part.term)fail(n,'Blok pilih belum ditutup dengan selesai');
   let hasDefault=false;
   while(part.term!=='selesai'){
     if(part.term==='lainnya'){
       if(hasDefault)fail(part.line,'Cabang lainnya sudah ada');hasDefault=true;
       const tail=block(true,true);fallback=tail.nodes;
       if(tail.term!=='selesai')fail(tail.line||n,'Cabang lainnya harus menjadi cabang terakhir');
       part=tail;continue;
     }
     const match=/^kasus (.+)$/.exec(part.term||'');if(!match)fail(part.line||n,'Diharapkan kasus atau lainnya');
     const condition=expr(match[1],part.line),tail=block(true,true);
     cases.push({test:condition,body:tail.nodes,n:part.line});part=tail;
     if(!part.term)fail(n,'Blok pilih belum ditutup dengan selesai');
   }
   if(!cases.length&&!hasDefault)fail(n,'pilih membutuhkan setidaknya satu kasus');
   push({type:'select',value,cases,otherwise:fallback});
 }
 else if((m=/^selama (.+) maka$/.exec(line)))push({type:'while',cond:expr(m[1],n),body:nestedBlock('selama').nodes});
 else if((m=/^ulangi (.+) kali$/.exec(line)))push({type:'repeat',count:expr(m[1],n),body:nestedBlock('ulangi').nodes});
 else if((m=/^untuk ([\p{L}_][\p{L}\p{N}_]*) dari (.+?) sampai (.+?)(?: langkah (.+))?$/u.exec(line))){push({type:'forrange',name:safe(m[1],n),start:expr(m[2],n),end:expr(m[3],n),step:m[4]?expr(m[4],n):{k:'lit',value:1},body:nestedBlock('untuk').nodes})}
 else if((m=/^untuk setiap ([\p{L}_][\p{L}\p{N}_]*) dalam (.+)$/u.exec(line)))push({type:'foreach',name:safe(m[1],n),items:expr(m[2],n),body:nestedBlock('untuk setiap').nodes});
 else if((m=/^(?:fungsi (asinkron )?|asinkron fungsi )([\p{L}_][\p{L}\p{N}_]*)\(([^()]*)\)(?::\s*([\p{L}_][\p{L}\p{N}_]*))?$/u.exec(line))){const parsed=m[3].trim()?m[3].split(',').map(x=>{const hit=/^([\p{L}_][\p{L}\p{N}_]*)(?:\s*:\s*([\p{L}_][\p{L}\p{N}_]*))?$/u.exec(x.trim());if(!hit)fail(n,'Parameter tidak valid: '+x.trim());return {name:safe(hit[1],n),type:hit[2]||'bebas'}}):[];const args=parsed.map(x=>x.name);if(new Set(args).size!==args.length)fail(n,'Parameter duplikat');push({type:'fn',async:!!m[1]||line.startsWith('asinkron fungsi '),name:safe(m[2],n),args,paramTypes:parsed.map(x=>x.type),returnType:m[4]||'bebas',body:nestedBlock('fungsi').nodes})}
 else if((m=/^kelas ([\p{L}_][\p{L}\p{N}_]*)(?: (?:turunan|mewarisi) ([\p{L}_][\p{L}\p{N}_]*))?$/u.exec(line))){const body=nestedBlock('kelas').nodes;if(body.some(x=>x.type!=='fn'))fail(n,'Isi kelas hanya boleh fungsi/metode');push({type:'class',name:safe(m[1],n),parent:m[2]?safe(m[2],n):null,body})}
 else if(line==='coba'){const body=nestedBlock('coba',['tangkap','akhirnya','selesai']);let caught=[],last=[],errorName='kesalahan';let term=body.term;if(term==='tangkap'){if(pos<lines.length){const optional=lines[pos].s.match(/^sebagai ([\p{L}_][\p{L}\p{N}_]*)$/u);if(optional){errorName=safe(optional[1],lines[pos].n);pos++}}const b=nestedBlock('tangkap',['akhirnya','selesai']);caught=b.nodes;term=b.term}if(term==='akhirnya')last=nestedBlock('akhirnya').nodes;push({type:'try',body:body.nodes,catchBody:caught,errorName,finallyBody:last,hasCatch:body.term==='tangkap',hasFinally:term==='akhirnya'})}
 else if((m=/^coba tangkap(?: ([\p{L}_][\p{L}\p{N}_]*))?$/u.exec(line))){const b=nestedBlock('coba tangkap',['tangkap','akhirnya','selesai']);let caught=[],last=[],hasFinally=b.term==='akhirnya',errorName=m[1]?safe(m[1],n):'kesalahan';if(b.term==='tangkap'){const c=nestedBlock('tangkap',['akhirnya','selesai']);caught=c.nodes;if(c.term==='akhirnya'){hasFinally=true;last=nestedBlock('akhirnya').nodes}}else if(b.term==='akhirnya')last=nestedBlock('akhirnya').nodes;push({type:'try',body:b.nodes,catchBody:caught,errorName,finallyBody:last,hasCatch:b.term==='tangkap',hasFinally})}
 else if(line==='berhenti'||line==='lanjut')push({type:line});
 else if((m=/^gunakan (python|javascript) "([^"\r\n]+)"(?: sebagai ([\p{L}_][\p{L}\p{N}_]*))?$/u.exec(line))){
   const kind=m[1],moduleName=m[2];
   if(kind==='python'&&(!/^[a-zA-Z_][a-zA-Z0-9_.]{0,100}$/.test(moduleName)||moduleName.split('.').some(part=>part.startsWith('_'))))fail(n,'Nama modul Python tidak valid');
   if(kind==='javascript'&&(!/^(?:node:[a-z][a-z0-9_/-]*|@[a-z\d_-]+\/[a-z\d_.-]+|[a-z\d][a-z\d_.-]*)$/i.test(moduleName)||moduleName.length>120))fail(n,'Nama modul JavaScript tidak valid');
   const alias=safe(m[3]||moduleName.split(/[\/:.]/).at(-1).replace(/[^a-zA-Z0-9_]/g,'_'),n);
   push({type:'smartImport',kind,moduleName,alias});
 }
 else if((m=/^gunakan ([\p{L}_][\p{L}\p{N}_]*)$/u.exec(line)))push({type:'use',name:safe(m[1],n)})
 else if((m=/^impor (.+) dari "([\p{L}\p{N}_/-]+)"$/u.exec(line))){const names=m[1].split(',').map(x=>safe(x.trim(),n));if(new Set(names).size!==names.length)fail(n,'Import duplikat');if(m[2].includes('..')||m[2].startsWith('/'))fail(n,'Path modul tidak diizinkan');push({type:'import',names,from:m[2]})}
 else if((m=/^ketika tombol (.+) diklik$/.exec(line)))push({type:'event',label:expr(m[1],n),body:nestedBlock('event').nodes});
 else if((m=/^buat halaman bernama (.+)$/.exec(line)))push({type:'web',method:'page',args:[expr(m[1],n)]});
 else if((m=/^buat judul (.+)$/.exec(line)))push({type:'web',method:'title',args:[expr(m[1],n)]});
 else if((m=/^buat teks (.+)$/.exec(line)))push({type:'web',method:'text',args:[expr(m[1],n)]});
 else if((m=/^buat tombol (.+)$/.exec(line)))push({type:'web',method:'button',args:[expr(m[1],n)]});
 else if((m=/^buat masukan angka (.+)$/.exec(line)))push({type:'web',method:'numberField',args:[expr(m[1],n)]});
 else if((m=/^buat masukan (.+)$/.exec(line)))push({type:'web',method:'inputField',args:[expr(m[1],n)]});
 else if((m=/^buat wadah (.+)$/.exec(line)))push({type:'web',method:'container',args:[expr(m[1],n)]});
 else if(line==='tutup wadah')push({type:'web',method:'endContainer',args:[]});
 else if((m=/^atur kelas (.+) menjadi (.+)$/.exec(line)))push({type:'web',method:'setClass',args:[expr(m[1],n),expr(m[2],n)]});
 else if((m=/^atur gaya (.+) properti (.+) menjadi (.+)$/.exec(line)))push({type:'web',method:'setStyle',args:[expr(m[1],n),expr(m[2],n),expr(m[3],n)]});
 else if((m=/^buat kartu (.+)$/.exec(line)))push({type:'web',method:'card',args:[expr(m[1],n)]});
 else if((m=/^buat grafik (.+) dari (.+)$/.exec(line)))push({type:'web',method:'chart',args:[expr(m[1],n),expr(m[2],n)]});
 else if((m=/^atur tema menjadi (.+)$/.exec(line)))push({type:'web',method:'theme',args:[expr(m[1],n)]});
 else if((m=/^ketika masukan (.+) berubah$/.exec(line)))push({type:'inputevent',label:expr(m[1],n),body:nestedBlock('event masukan').nodes});
 else if((m=/^atur latar halaman menjadi (.+)$/.exec(line)))push({type:'web',method:'background',args:[expr(m[1],n)]});
 else if((m=/^atur warna judul menjadi (.+)$/.exec(line)))push({type:'web',method:'titleColor',args:[expr(m[1],n)]});
 else if((m=/^ubah judul menjadi (.+)$/.exec(line)))push({type:'web',method:'changeTitle',args:[expr(m[1],n)]});
 else if(exported)fail(n,'Hanya deklarasi variabel, fungsi, dan kelas yang bisa diekspor');
 else {let e;try{e=expr(line,n)}catch(error){if(/^(?:lainnya|else)\b/.test(line))fail(n,'Gunakan "jika tidak" untuk cabang alternatif.');throw error}if(!['call','new'].includes(e.k)&&!(e.k==='unary'&&e.op==='tunggu'))fail(n,`Perintah '${line.slice(0,38)}' tidak dikenal. Gunakan sintaks Aksara atau pemanggilan fungsi seperti tampilkan("teks").`);push({type:'eval',value:e})}
 }return {nodes:out,term:null}}
 return simplifyAssignments(block().nodes)}
const builtins={pastikan:'assert',dalam_daftar:'contains',web_masukan:'inputField',web_nilai:'inputValue',web_angka:'numberValue',web_atur_nilai:'setInputValue',web_bersihkan_masukan:'inputClear',web_kartu:'card',web_grafik:'chart',web_ubah_teks:'setText',web_tema:'theme',web_daftar:'list',web_ubah_daftar:'setList',web_kosongkan:'clear',simpan_data:'storageSet',baca_data:'storageGet',hapus_data:'storageDelete',daftar_data:'storageKeys',ambil_teks:'fetchText',kirim_json:'postJSON',modul_js:'importJS',python_panggil:'pythonCall',python_panggil_async:'pythonCallAsync',baca_file_json:'readJSONFile',simpan_file_json:'writeJSONFile',bersamaan:'all',kerjakan_paralel:'parallelMap',baca_file:'readTextFile',simpan_file:'writeTextFile',daftar_file:'listFiles',ambil_api:'fetchAPI',kirim_api:'postAPI',baca_env:'readEnv',kelompokkan:'groupBy',frekuensi:'frequencies',ai_tanya:'aiAsk', angka:'num',teks:'str',panjang:'len',tipe:'type',jumlah:'sum',maksimum:'max',minimum:'min',bulat:'floor',mutlak:'abs',akar:'sqrt',pangkat:'pow',bulat_atas:'ceil',bulat_terdekat:'round',acak:'random',urut:'sort',balik:'reverse',berisi:'includes',ganti_teks:'replace',rentang:'range',gabung:'join',pecah:'split',huruf_besar:'upper',huruf_kecil:'lower',tambah:'push',hapus:'remove',kunci:'keys',nilai:'values',json:'toJSON',baca_json:'fromJSON',tanya:'input',jeda:'sleep',ambil_json:'fetchJSON',web_halaman:'page',web_judul:'title',web_teks:'text',web_tombol:'button',web_bersihkan:'clear',web_latar:'background',web_warna_judul:'titleColor',web_ubah_judul:'changeTitle',web_tombol_natural:'button',rata_rata:'average',unik:'unique',ambil:'slice',petakan:'map',saring:'filter',temukan:'find',reduksi:'reduce',semua:'every',ada:'some',hitung:'count',urutan:'enumerate',sisip:'insert',kamus_gabung:'merge',format:'format',potong:'slice',cetak_json:'prettyJSON',serentak:'all',tercepat:'race',acak_antara:'randomInt',waktu_sekarang:'now',tanggal:'date',huruf_awal:'startsWith',huruf_akhir:'endsWith',rapikan_teks:'trim',batasi:'clamp',tanggal_format:'dateFormat',tunggu_batas:'withTimeout',semua_selesai:'allSettled',coba_lagi:'retry',tunda:'sleep',database_buka:'openDatabase',web_tautan:'navigateLink',web_gaya_kelas:'styleRule',web_responsif:'mediaRule',hardware_api:'hardwareAPI',server_buat:'makeServer',web_status:'state',web_komponen:'component',web_pasang:'mountComponent',web_rute:'route',web_mulai_rute:'startRouter',web_pergi:'navigate',web_lokasi:'currentRoute'};
const webBuiltin=new Set(Object.keys(builtins).filter(x=>x.startsWith('web_')));
function genExpr(e,line,ctx){switch(e.k){case 'lit':return JSON.stringify(e.value);case 'interpolate':return '('+e.parts.map(p=>typeof p==='string'?JSON.stringify(p):`__rt.str(${genExpr(p,line,ctx)})`).join('+')+')';case 'name':return Object.hasOwn(builtins,e.name)&&!ctx.userNames?.has(e.name)?'__rt.'+builtins[e.name]:e.name;case 'self':return 'this';case 'super':return 'super';case 'array':return `[${e.els.map(x=>genExpr(x,line,ctx)).join(',')}]`;case 'obj':return `__rt.dict({${e.props.map(([k,v])=>`${JSON.stringify(k)}:${genExpr(v,line,ctx)}`).join(',')}})`;case 'member':return `${e.base.k==='lit'&&typeof e.base.value==='number'?'('+genExpr(e.base,line,ctx)+')':genExpr(e.base,line,ctx)}.${e.prop}`;case 'index':return `__rt.index(${genExpr(e.base,line,ctx)},${genExpr(e.index,line,ctx)},${line})`;case 'new':return `new ${e.name}(${e.args.map(x=>genExpr(x,line,ctx)).join(',')})`;case 'call':{if(e.target.k==='index')return `__rt.callIndex(${genExpr(e.target.base,line,ctx)},${genExpr(e.target.index,line,ctx)},[${e.args.map(x=>genExpr(x,line,ctx)).join(',')}],${line})`;if(e.target.k==='super')return `super(${e.args.map(x=>genExpr(x,line,ctx)).join(',')})`;return `${e.target.k==='name'&&Object.hasOwn(builtins,e.target.name)&&!ctx.userNames?.has(e.target.name)?'__rt.'+builtins[e.target.name]:genExpr(e.target,line,ctx)}(${e.args.map(x=>genExpr(x,line,ctx)).join(',')})`};case 'unary':if(e.op==='tunggu'&&!ctx.async)fail(line,'tunggu hanya dalam fungsi asinkron atau program utama');return e.op==='tunggu'?`(await ${genExpr(e.right,line,ctx)})`:e.op==='tidak'?`(!${genExpr(e.right,line,ctx)})`:`(${e.op}${genExpr(e.right,line,ctx)})`;case 'bin':{const a=genExpr(e.left,line,ctx),b=genExpr(e.right,line,ctx);if(e.op==='+')return `__rt.add(${a},${b})`;if(e.op==='//')return `__rt.floor(${a}/${b})`;if(e.op==='dalam')return `__rt.contains(${b},${a})`;if(e.op==='??')return `(${a} ?? ${b})`;const op=e.op==='dan'?'&&':e.op==='atau'?'||':e.op==='=='?'===':e.op==='!='?'!==':e.op;return `(${a} ${op} ${b})`}}fail(line,'Jenis ekspresi tidak dikenal')}
function count(nodes){return nodes.reduce((sum,n)=>sum+1+['body','yes','no','catchBody','finallyBody','otherwise'].reduce((total,k)=>total+(Array.isArray(n[k])?count(n[k]):0),0)+(n.type==='select'?n.cases.reduce((x,c)=>x+count(c.body),0):0),0)}
function analyze(nodes,diagnostics,scope={fn:false,loop:false,klass:false,async:true,module:true}){
 const declared=new Set(scope.locals||[]),constants=new Set(scope.constants||[]);
 const nested=overrides=>{const child={...scope,module:false,constants:new Set(constants),locals:[],...overrides};for(const name of child.locals)child.constants.delete(name);return child};
 let stopped=false;
 for(const n of nodes){
  const inspect=e=>{if(!e||typeof e!=='object')return;if(e.k==='unary'&&e.op==='tunggu'&&!scope.async)diagnostics.push({line:n.n,severity:'error',message:'tunggu hanya dalam fungsi asinkron atau program utama'});for(const value of Object.values(e))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(inspect):inspect(value)};
  for(const value of Object.values(n))if(value&&typeof value==='object'&&!Array.isArray(value)&&value.k)inspect(value);
  if(n.type==='web')n.args.forEach(inspect);
  if(n.type==='test')inspect(n.label);
  if(n.type==='smartImport'&&!scope.module)diagnostics.push({line:n.n,severity:'error',message:'Smart Import hanya boleh di tingkat modul'});
  if(n.type==='import'&&!scope.module)diagnostics.push({line:n.n,severity:'error',message:'impor hanya di tingkat modul'});
  if(n.exported&&!scope.module)diagnostics.push({line:n.n,severity:'error',message:'ekspor hanya di tingkat modul'});
  if(stopped)diagnostics.push({line:n.n,severity:'warning',message:'Instruksi setelah kembalikan/berhenti/lanjut mungkin tidak dijalankan'});
  if(['declare','fn','class'].includes(n.type)){
   if(declared.has(n.name))diagnostics.push({line:n.n,severity:'error',message:`'${n.name}' sudah dideklarasikan di blok ini`});
   declared.add(n.name);
   if(n.type==='declare'&&n.constant)constants.add(n.name);else constants.delete(n.name);
  }
  if(n.type==='assign'&&n.target.k==='name'&&constants.has(n.target.name))diagnostics.push({line:n.n,severity:'error',message:`Konstanta '${n.target.name}' tidak bisa diubah`});
  if(n.type==='return'&&!scope.fn)diagnostics.push({line:n.n,severity:'error',message:'kembalikan hanya dalam fungsi'});
  if(['berhenti','lanjut'].includes(n.type)&&!scope.loop)diagnostics.push({line:n.n,severity:'error',message:`${n.type} hanya dalam perulangan`});
  if(n.type==='fn'){
   const child=nested({fn:true,loop:false,async:n.async,locals:n.args});for(const a of n.args)child.constants.delete(a);
   analyze(n.body,diagnostics,child);
  }
  if(n.type==='class'){if(n.parent===n.name)diagnostics.push({line:n.n,severity:'error',message:'Kelas tidak boleh mewarisi dirinya sendiri'});const methods=new Set();for(const met of n.body){if(methods.has(met.name))diagnostics.push({line:met.n,severity:'error',message:'Metode duplikat: '+met.name});methods.add(met.name)}}
  if(n.type==='class')for(const met of n.body){
   if(met.name==='mulai'&&met.async)diagnostics.push({line:met.n,severity:'error',message:'Constructor tidak boleh asinkron'});
   const child=nested({fn:true,loop:false,klass:true,async:met.async,locals:met.args});for(const a of met.args)child.constants.delete(a);
   analyze(met.body,diagnostics,child);
  }
  if(n.type==='try'&&!n.hasCatch&&!n.hasFinally)diagnostics.push({line:n.n,severity:'error',message:'coba membutuhkan tangkap atau akhirnya'});
  if(n.type==='smartImport'){if(declared.has(n.alias))diagnostics.push({line:n.n,severity:'error',message:`'${n.alias}' sudah dideklarasikan di blok ini`});declared.add(n.alias);constants.add(n.alias)}
  if(n.type==='import')for(const name of n.names){if(declared.has(name))diagnostics.push({line:n.n,severity:'error',message:`'${name}' sudah dideklarasikan di blok ini`});declared.add(name);constants.add(name)}
  for(const key of ['yes','no','catchBody','finallyBody','otherwise'])if(n[key])analyze(n[key],diagnostics,nested({locals:key==='catchBody'?[n.errorName]:[]}));
  if(n.type==='select'){
   const seen=new Set();
   for(const c of n.cases){if(c.test.k==='lit'){
     const key=JSON.stringify(c.test.value);if(seen.has(key))diagnostics.push({line:c.n,severity:'warning',message:`Kasus ${key} duplikat; cabang ini tidak akan terpilih`});seen.add(key);
   }analyze(c.body,diagnostics,nested({}));}
  }
  if(['repeat','foreach','while','forrange'].includes(n.type))analyze(n.body,diagnostics,nested({loop:true,locals:[n.type==='repeat'?'indeks':n.name].filter(Boolean)}));
  if(['event','inputevent','try'].includes(n.type))analyze(n.body,diagnostics,nested(['event','inputevent'].includes(n.type)?{async:true,fn:true,loop:false}:{}));
  if(n.type==='test'){if(!scope.module)diagnostics.push({line:n.n,severity:'error',message:'uji hanya boleh di tingkat modul'});analyze(n.body,diagnostics,nested({async:true,fn:true,loop:false}));}
  if(n.exported&&!['declare','fn','class'].includes(n.type))diagnostics.push({line:n.n,severity:'error',message:'Ekspor hanya untuk deklarasi'});
  stopped=['return','berhenti','lanjut','throw'].includes(n.type);
 }
}
function generateNodes(nodes,ctx,indent=1){ctx={...ctx,userNames:new Set([...(ctx.userNames||[]),...nodes.filter(n=>['declare','fn','class'].includes(n.type)).map(n=>n.name),...nodes.filter(n=>n.type==='import').flatMap(n=>n.names),...nodes.filter(n=>n.type==='smartImport').map(n=>n.alias)])};const pad='  '.repeat(indent);let js='';const emit=s=>{js+=pad+s+'\n'};const block=(body,next)=>'{\n'+generateNodes(body,{...ctx,...next},indent+1)+pad+'}';for(const n of nodes){const E=e=>genExpr(e,n.n,ctx);emit(`// @aksara ${ctx.file||'program.aks'}:${n.n}`);emit(`__rt.tick(${n.n},${JSON.stringify(ctx.file||'program.aks')});`);if(ctx.breakpoints?.[ctx.file||'program.aks']?.includes(n.n))emit('debugger;');switch(n.type){case 'declare':emit(`${n.constant?'const':'let'} ${n.name} = ${E(n.value)};`);break;case 'assign':if(n.target.k==='index')emit(`__rt.setIndex(${E(n.target.base)},${E(n.target.index)},${E(n.value)},${n.n});`);else emit(`${E(n.target)} = ${E(n.value)};`);break;case 'print':emit(`__rt.print(${E(n.value)});`);break;case 'return':emit(`return ${E(n.value)};`);break;case 'throw':emit(`throw __rt.error(${E(n.value)});`);break;case 'if':emit(`if (${E(n.cond)}) ${block(n.yes)}${n.no.length?' else '+block(n.no):''}`);break;case 'select':{const temp=`__pilih${ctx.nextId++}`;emit(`{ const ${temp}=${E(n.value)};`);for(let i=0;i<n.cases.length;i++){const c=n.cases[i];emit(`${i?'else ':''}if (${temp} === ${E(c.test)}) ${block(c.body)}`)}if(n.otherwise.length)emit(`${n.cases.length?'else ':''}${block(n.otherwise)}`);emit('}');break} case 'while':emit(`while (${E(n.cond)}) {\n${pad}  __rt.tick(${n.n});\n${generateNodes(n.body,{...ctx},indent+1)}${pad}}`);break;case 'repeat':{const temp=`__ulang${ctx.nextId++}`;emit(`for (let ${temp}=1, __batas${ctx.nextId} = __rt.repeatCount(${E(n.count)}); ${temp}<=__batas${ctx.nextId}; ${temp}++) {\n${pad}  __rt.tick(${n.n});\n${pad}  let indeks=${temp};\n${generateNodes(n.body,{...ctx},indent+1)}${pad}}`);ctx.nextId++;break}case 'forrange':{const temp=`__range${ctx.nextId++}`;emit(`for (const ${temp} of __rt.rangeInclusive(${E(n.start)},${E(n.end)},${E(n.step)})) {\n${pad}  __rt.tick(${n.n});\n${pad}  let ${n.name}=${temp};\n${generateNodes(n.body,{...ctx,userNames:new Set([...ctx.userNames,n.name])},indent+1)}${pad}}`);break}case 'foreach':{const temp=`__item${ctx.nextId++}`;emit(`for (const ${temp} of __rt.iter(${E(n.items)})) {\n${pad}  __rt.tick(${n.n});\n${pad}  let ${n.name}=${temp};\n${generateNodes(n.body,{...ctx,userNames:new Set([...ctx.userNames,n.name])},indent+1)}${pad}}`);break}case 'fn':{const body=generateNodes(n.body,{...ctx,async:n.async,userNames:new Set([...ctx.userNames,...n.args])},indent+1);emit(`${n.async?'async ':''}function ${n.name}(${n.args.join(',')}) {\n${body}${pad}}`);emit(`__rt.register(${JSON.stringify(n.name)},${n.name});`);break}case 'class':{emit(`class ${n.name}${n.parent?' extends '+n.parent:''} {`);for(const m of n.body){const init=m.name==='mulai';if(init&&m.async)fail(m.n,'Constructor tidak boleh asinkron');const code=generateNodes(m.body,{...ctx,async:m.async,userNames:new Set([...ctx.userNames,...m.args])},indent+1);emit(`  ${m.async?'async ':''}${init?'constructor':m.name}(${m.args.join(',')}) {\n${code}${pad}  }`)}emit('}');break}case 'use':emit(`__rt.enable(${JSON.stringify(n.name)});`);break;case 'smartImport':emit(`__rt.enable(${JSON.stringify(n.kind)});`);emit(`const ${n.alias} = ${n.kind==='python'?`__rt.importPython(${JSON.stringify(n.moduleName)})`:`await __rt.importJS(${JSON.stringify(n.moduleName)})`};`);break;case 'import':emit(`const {${n.names.join(',')}} = await __load(${JSON.stringify(n.from)});`);break;case 'event':emit(`__rt.onButton(${E(n.label)},async ()=>${block(n.body,{async:true})});`);break;case 'inputevent':emit(`__rt.onInput(${E(n.label)},async ()=>${block(n.body,{async:true})});`);break;case 'web':emit(`__rt.${n.method}(${n.args.map(E).join(',')});`);break;case 'test':emit(`await __rt.test(${E(n.label)},async ()=>${block(n.body,{async:true})});`);break;case 'eval':emit(`${E(n.value)};`);break;case 'berhenti':emit('break;');break;case 'lanjut':emit('continue;');break;case 'try':{emit(`try ${block(n.body)}${n.hasCatch?` catch (__error) {\n${pad}  const ${n.errorName}=__rt.str(__error.message??__error);\n${generateNodes(n.catchBody,{...ctx,userNames:new Set([...ctx.userNames,n.errorName])},indent+1)}${pad}}`:''}${n.hasFinally?' finally '+block(n.finallyBody):''}`);break}default:fail(n.n,`Instruksi '${n.type}' tidak dikenal`)}}return js}
function parseModuleName(s){return String(s).replace(/\.aks$/,'')}
function compileProject(files,entry='program.aks',options={}){
 if(!files||typeof files!=='object'||Array.isArray(files))throw Error('Project harus objek nama file ke source');const tree=Object.create(null),diagnostics=[],moduleExports=Object.create(null);const names=Object.keys(files);if(!names.length||names.length>40)throw Error('Jumlah berkas harus 1–40');if(!Object.hasOwn(files,entry))throw Error(`Berkas utama '${entry}' tidak ditemukan`);let total=0;for(const file of names){if(!/^[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*(?:\/[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*)*\.aks$/u.test(file))throw Error(`Nama berkas '${file}' tidak valid`);if(typeof files[file]!=='string'||files[file].length>100000)throw Error(`Berkas '${file}' harus teks maksimal 100 KB`);let ast=[];try{ast=parseSource(files[file])}catch(e){diagnostics.push({file,line:e.line||1,severity:'error',message:e.message})}tree[file]=ast;const fromDiag=diagnostics.length;analyze(ast,diagnostics);for(let i=fromDiag;i<diagnostics.length;i++)diagnostics[i].file=file;moduleExports[file]=new Set(ast.filter(x=>x.exported).map(x=>x.name));total+=count(ast)}
 for(const file of names){for(const node of tree[file])if(node.type==='import'){const target=node.from+'.aks';if(!Object.hasOwn(tree,target))diagnostics.push({line:node.n,file,severity:'error',message:`Modul '${target}' tidak ditemukan`});else for(const name of node.names)if(!moduleExports[target].has(name))diagnostics.push({line:node.n,file,severity:'error',message:`'${name}' tidak diekspor oleh '${target}'`})}}
 // Deteksi siklus impor yang bisa membuat Promise modul saling menunggu tanpa akhir.
 const visiting=new Set(),visited=new Set(),path=[];
 function walkModules(file){if(visiting.has(file)){const from=path[path.length-1]||file;diagnostics.push({file:from,line:tree[from].find(x=>x.type==='import'&&x.from+'.aks'===file)?.n||1,severity:'error',message:'Impor melingkar: '+[...path.slice(path.indexOf(file)),file].join(' → ')});return}if(visited.has(file))return;visiting.add(file);path.push(file);for(const node of tree[file])if(node.type==='import'&&Object.hasOwn(tree,node.from+'.aks'))walkModules(node.from+'.aks');path.pop();visiting.delete(file);visited.add(file)}
 for(const file of names)walkModules(file);
 diagnostics.push(...Semantics.check(tree,{builtins:Object.keys(builtins),strict:!!options.strict}));
 for(const diag of diagnostics)Diagnostics.enrich(diag,files[diag.file]||'',{builtins:Object.keys(builtins)});
 let javascript=null;if(!diagnostics.some(d=>d.severity==='error')){let compiled='';const ctx={nextId:0,async:true,breakpoints:options.breakpoints||{}};for(const file of names){const ast=tree[file];compiled+=`__register(${JSON.stringify(parseModuleName(file))}, async () => {\n`;compiled+=generateNodes(ast,{...ctx,file},1);compiled+='  const __exp=Object.create(null);\n';for(const node of ast)if(node.exported)compiled+=`  __exp[${JSON.stringify(node.name)}]=${node.name};\n`;compiled+='  return __exp;\n});\n'}
 javascript=`// Generated by Aksara ${VERSION}. Standalone ES2020+ JavaScript.\n'use strict';\n${runtimeSource()}\nconst __modules=Object.create(null),__cache=Object.create(null);\nfunction __register(name,init){__modules[name]=init}\nasync function __load(name){if(!Object.hasOwn(__modules,name))throw Error('Modul '+name+' tidak tersedia');if(!Object.hasOwn(__cache,name))__cache[name]=Promise.resolve().then(()=>__modules[name]());return __cache[name]}\n${compiled}\n(async()=>{try{await __load(${JSON.stringify(parseModuleName(entry))});__rt.done()}catch(e){__rt.fail(e);if(typeof document==='undefined')process.exitCode=1}})();\n`;}
 const sourceMap=javascript?createSourceMap(javascript,files):null;
 return {ast:tree[entry],modules:tree,diagnostics,javascript,sourceMap,stats:{lines:names.reduce((sum,f)=>sum+files[f].split(/\r?\n/).length,0),statements:total,functions:names.reduce((sum,f)=>sum+tree[f].filter(x=>x.type==='fn').length,0),modules:names.length},version:VERSION}}
 // Source Map v3: mapping per statement generated from the original Aksara file and line.
 // Each generated JavaScript line inside a statement is attributed to its source statement.
 function createSourceMap(javascript,files){
  const names=Object.keys(files),b64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function vlq(n){let value=n<0?((-n)<<1)|1:n<<1,out='';do{let chunk=value&31;value=Math.floor(value/32);if(value)chunk|=32;out+=b64[chunk]}while(value);return out}
  let source=0,originalLine=0,prevSource=0,prevOriginal=0,active=false;
  const mappings=[];
  for(const line of javascript.split('\n')){
    const hit=/^\s*\/\/ @aksara (.+):(\d+)\s*$/.exec(line);
    if(hit){source=names.indexOf(hit[1]);originalLine=Number(hit[2])-1;active=true}
    // Map executable lines after each marker, excluding runtime/module bookkeeping.
    if(/^__register\(|^\s*const __exp=|^\}\);/.test(line))active=false;
    if(active&&source>=0){mappings.push(vlq(0)+vlq(source-prevSource)+vlq(originalLine-prevOriginal)+vlq(0));prevSource=source;prevOriginal=originalLine}
    else mappings.push('');
  }
  return {version:3,file:'program.js',sources:names,sourcesContent:names.map(n=>files[n]),names:[],mappings:mappings.join(';')};
 }
 function runtimeSource(){if(typeof AksaraRuntime!=='function')throw Error('runtime.js harus dimuat sebelum compiler.js');return `const __rt=(${AksaraRuntime.toString()})();`}
 function compile(source,options={}){return compileProject({'program.aks':source},'program.aks',options)}
 return {version:VERSION,tokenize,lex:code=>Lexer.scan(code,{newlines:true,comments:true}),parse:parseSource,parseExpr:expr,compile,compileProject,builtins:Object.keys(builtins)};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Aksara;
