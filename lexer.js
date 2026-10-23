'use strict';
/* Aksara 2.5 lexical scanner. Tokens include source offsets, lines, and columns. */
const AksaraLexer=(()=>{
  const words=/^[\p{L}_][\p{L}\p{N}_]*/u;
  const numbers=/^(?:\d+(?:\.\d+)?)/;
  const symbols=new Set('+-*/%()[]{}.,:<>=');
  const pairs=new Set(['==','!=','>=','<=','**','//','??']);
  function scan(code,options={}){
    const source=String(code).replace(/\r\n?/g,'\n');
    const tokens=[];let i=0,line=1,column=1;
    const push=(type,raw,start,lin,col)=>tokens.push({type,raw,line:lin,column:col,start,end:i});
    const advance=()=>{const c=source[i++];if(c==='\n'){line++;column=1}else column++;return c};
    while(i<source.length){
      let c=source[i];
      if(c===' '||c==='\t'||c==='\v'||c==='\f'){advance();continue}
      if(c==='\n'){const at=i,ln=line,col=column;advance();if(options.newlines)push('newline','\n',at,ln,col);continue}
      if(c==='#'){const at=i,ln=line,col=column;while(i<source.length&&source[i]!=='\n')advance();if(options.comments)push('comment',source.slice(at,i),at,ln,col);continue}
      const start=i,ln=line,col=column;
      if(c==='"'||c==="'"){
        const q=advance();let closed=false;
        while(i<source.length){const ch=advance();if(ch==='\\'&&i<source.length){advance();continue}if(ch===q){closed=true;break}if(ch==='\n')break}
        if(!closed){const e=new Error(`Baris ${ln}, kolom ${col}: Teks belum ditutup`);e.line=ln;e.column=col;throw e}
        push('str',source.slice(start,i),start,ln,col);continue;
      }
      let match=numbers.exec(source.slice(i));
      if(match){for(let z=0;z<match[0].length;z++)advance();push('num',match[0],start,ln,col);continue}
      match=words.exec(source.slice(i));
      if(match){for(let z=0;z<match[0].length;z++)advance();push('id',match[0],start,ln,col);continue}
      const pair=source.slice(i,i+2);
      if(pairs.has(pair)){advance();advance();push('sym',pair,start,ln,col);continue}
      if(symbols.has(c)){advance();push('sym',c,start,ln,col);continue}
      const e=new Error(`Baris ${ln}, kolom ${col}: Karakter '${c}' tidak dikenal`);e.line=ln;e.column=col;throw e;
    }
    return tokens;
  }
  const expression=(source,line=1)=>{
    const tokens=scan(source);
    for(const t of tokens)t.line+=line-1;
    return tokens;
  };
  return {scan,expression};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AksaraLexer;
