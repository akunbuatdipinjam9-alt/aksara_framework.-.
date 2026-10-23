'use strict';
/* Optional semantic/type checks for Aksara 2.5. Dynamic values remain legal. */
const AksaraSemantic=(()=>{
 const typeNames=new Set(['angka','teks','logika','daftar','kamus','kosong','bebas']);
 const jsBuiltin=new Set(['indeks']);
 class Scope {
   constructor(parent=null){this.parent=parent;this.symbols=new Map()}
   add(name,info){this.symbols.set(name,info)}
   find(name){return this.symbols.get(name)||this.parent?.find(name)||null}
 }
 function check(modules,{builtins=[],strict=false}={}){
  const diagnostics=[],known=new Set([...builtins,...jsBuiltin]);
  const diag=(file,line,message,severity='warning')=>diagnostics.push({file,line,severity,message,phase:'semantic'});
  const rootNames=new Map();
  for(const [file,nodes] of Object.entries(modules)){
   const root=new Scope();rootNames.set(file,root);
   for(const b of known)root.add(b,{type:'fungsi',builtin:true});
   for(const n of nodes){
    if(['declare','fn','class'].includes(n.type))root.add(n.name,{type:n.type==='declare'?(n.typeName||'bebas'):n.type==='fn'?'fungsi':'kelas',annotated:n.typeName||null,node:n,params:n.paramTypes,returns:n.returnType});
    if(n.type==='import')for(const name of n.names)root.add(name,{type:'bebas'});
    if(n.type==='smartImport')root.add(n.alias,{type:'bebas'});
   }
  }
  function expr(e,scope,file,line,context){
   if(!e)return 'bebas';
   switch(e.k){
    case 'interpolate':for(const part of e.parts)if(typeof part==='object'){if(part.k==='name'&&!scope.find(part.name)&&!strict)diag(file,line,`Nama '${part.name}' belum dideklarasikan`,'error');expr(part,scope,file,line,context)}return 'teks';
    case 'lit':return e.value===null?'kosong':typeof e.value==='number'?'angka':typeof e.value==='boolean'?'logika':typeof e.value==='string'?'teks':'bebas';
    case 'array':for(const child of e.els)expr(child,scope,file,line,context);return 'daftar';
    case 'obj':for(const [,child] of e.props)expr(child,scope,file,line,context);return 'kamus';
    case 'name':{
      const found=scope.find(e.name);
      if(!found&&strict)diag(file,line,`Nama '${e.name}' belum dideklarasikan`,'error');
      return found?.type||'bebas';
    }
    case 'self':if(!context.inClass)diag(file,line,"'diri' hanya boleh di dalam metode kelas",'error');return 'bebas';
    case 'super':if(!context.parentClass)diag(file,line,"'induk' hanya boleh di dalam kelas turunan",'error');else if(!context.superAccess)diag(file,line,"Gunakan induk.metode() atau induk() pada constructor",'error');return 'bebas';
    case 'member':expr(e.base,scope,file,line,{...context,superAccess:e.base.k==='super'});return 'bebas';
    case 'index':expr(e.base,scope,file,line,context);expr(e.index,scope,file,line,context);return 'bebas';
    case 'new':{
      const found=scope.find(e.name);if(!found&&strict)diag(file,line,`Kelas '${e.name}' tidak ditemukan`,'error');
      for(const a of e.args)expr(a,scope,file,line,context);return 'bebas';
    }
    case 'call':{
      if(e.target.k==='super'&&!context.isConstructor)diag(file,line,'induk() hanya boleh pada constructor kelas turunan','error');
      expr(e.target,scope,file,line,{...context,superAccess:e.target.k==='super'});
      const argTypes=e.args.map(a=>expr(a,scope,file,line,context));
      if(e.target.k==='name'){
        const symbol=scope.find(e.target.name);
        if(symbol?.params){
          if(argTypes.length!==symbol.params.length)diag(file,line,`Fungsi '${e.target.name}' membutuhkan ${symbol.params.length} argumen, diberikan ${argTypes.length}`,'error');
          argTypes.forEach((got,i)=>{const expected=symbol.params[i];if(expected&&expected!=='bebas'&&got!=='bebas'&&got!==expected)diag(file,line,`Argumen ${i+1} '${e.target.name}' seharusnya ${expected}, bukan ${got}`,'error')});
          return symbol.returns||'bebas';
        }
      }
      return 'bebas';
    }
    case 'unary':{
      const t=expr(e.right,scope,file,line,context);
      if(e.op==='tidak')return 'logika';if(['+','-'].includes(e.op))return 'angka';return 'bebas';
    }
    case 'bin':{
      const a=expr(e.left,scope,file,line,context),b=expr(e.right,scope,file,line,context);
      if(['==','!=','>','<','>=','<=','lebih','kurang','sama','minimal','maksimal','dalam','dan','atau'].includes(e.op))return 'logika';
      if(e.op==='??')return a==='kosong'?b:a;
      if(e.op==='+'&&(a==='teks'||b==='teks'))return 'teks';
      if(['+','-','*','/','//','%','**'].includes(e.op)){
       if(a!=='bebas'&&b!=='bebas'&&!(a==='angka'&&b==='angka')&&!(e.op==='+'&&(a==='teks'||b==='teks')))
        diag(file,line,`Operasi '${e.op}' memakai tipe ${a} dan ${b}; hasil mungkin tidak sesuai`,'warning');
       return 'angka';
      }
      return 'bebas';
    }
    default:return 'bebas';
   }
  }
  function walk(nodes,scope,file,context){
   // Function declarations can be referenced before their definition.
   for(const n of nodes)if(n.type==='fn'&&!scope.symbols.has(n.name))scope.add(n.name,{type:'fungsi',params:n.paramTypes,returns:n.returnType});
   for(const n of nodes){
    const value=(e)=>expr(e,scope,file,n.n,context);
    switch(n.type){
      case 'declare':{
       if(n.typeName&&!typeNames.has(n.typeName))diag(file,n.n,`Tipe '${n.typeName}' tidak dikenal`,'error');
       const got=value(n.value),expected=n.typeName;
       if(expected&&expected!=='bebas'&&got!=='bebas'&&expected!==got)
        diag(file,n.n,`Variabel '${n.name}' bertipe ${expected}, tetapi nilainya ${got}`,'error');
       scope.add(n.name,{type:expected||got,annotated:expected||null});break;
      }
      case 'assign':{
       const got=value(n.value);
       if(n.target.k==='name'){
        const found=scope.find(n.target.name);
        if(!found&&strict)diag(file,n.n,`Variabel '${n.target.name}' belum dideklarasikan`,'error');
        if(found?.annotated&&found.annotated!=='bebas'&&got!=='bebas'&&got!==found.annotated)
         diag(file,n.n,`Variabel '${n.target.name}' harus bertipe ${found.annotated}, bukan ${got}`,'error');
       }else value(n.target);
       break;
      }
      case 'class':{
       if(n.parent&&strict&&!scope.find(n.parent))diag(file,n.n,`Kelas induk '${n.parent}' belum dideklarasikan`,'error');
       scope.add(n.name,{type:'kelas'});
       for(const method of n.body){const child=new Scope(scope);for(const t of [...(method.paramTypes||[]),method.returnType||'bebas'])if(!typeNames.has(t))diag(file,method.n,`Tipe '${t}' pada metode '${method.name}' tidak dikenal`,'error');method.args.forEach((a,i)=>child.add(a,{type:method.paramTypes?.[i]||'bebas'}));
        walk(method.body,child,file,{...context,inClass:true,parentClass:!!n.parent,isConstructor:method.name==='mulai',superAccess:false,returnType:method.returnType||'bebas'});}
       break;
      }
      case 'fn':{
        for(const t of [...(n.paramTypes||[]),n.returnType||'bebas'])if(!typeNames.has(t))diag(file,n.n,`Tipe '${t}' pada fungsi '${n.name}' tidak dikenal`,'error');
        const child=new Scope(scope);n.args.forEach((a,i)=>child.add(a,{type:n.paramTypes?.[i]||'bebas'}));
        walk(n.body,child,file,{...context,inClass:false,parentClass:false,isConstructor:false,superAccess:false,returnType:n.returnType||'bebas'});break
      }
      case 'if':value(n.cond);walk(n.yes,new Scope(scope),file,context);walk(n.no,new Scope(scope),file,context);break;
      case 'select':value(n.value);for(const c of n.cases){value(c.test);walk(c.body,new Scope(scope),file,context)}walk(n.otherwise,new Scope(scope),file,context);break;
      case 'foreach':{value(n.items);const child=new Scope(scope);child.add(n.name,{type:'bebas'});walk(n.body,child,file,context);break}
      case 'forrange':{value(n.start);value(n.end);value(n.step);const child=new Scope(scope);child.add(n.name,{type:'angka'});walk(n.body,child,file,context);break}
      case 'repeat':{value(n.count);const child=new Scope(scope);child.add('indeks',{type:'angka'});walk(n.body,child,file,context);break}
      case 'while':value(n.cond);walk(n.body,new Scope(scope),file,context);break;
      case 'try':walk(n.body,new Scope(scope),file,context);if(n.hasCatch){const child=new Scope(scope);child.add(n.errorName,{type:'teks'});walk(n.catchBody,child,file,context)}walk(n.finallyBody,new Scope(scope),file,context);break;
      case 'event':case 'inputevent':value(n.label);walk(n.body,new Scope(scope),file,context);break;
      case 'return':{
        const got=value(n.value),expected=context.returnType;
        if(expected&&expected!=='bebas'&&got!=='bebas'&&got!==expected)diag(file,n.n,`Fungsi harus mengembalikan ${expected}, bukan ${got}`,'error');
        break;
      }
      case 'print':case 'eval':case 'throw':value(n.value);break;
      case 'web':for(const a of n.args)value(a);break;
      case 'import':for(const name of n.names)scope.add(name,{type:'bebas'});break;
     }
   }
  }
  for(const [file,nodes] of Object.entries(modules))walk(nodes,rootNames.get(file),file,{});
  return diagnostics;
 }
 return {check,typeNames:[...typeNames]};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AksaraSemantic;
