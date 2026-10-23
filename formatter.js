'use strict';
// Formatter preserves source expressions and comments; only normalizes block indentation.
const AksaraFormatter=(()=>{
  const opens=s=>/^(?:jika .+ maka|selama .+ maka|ulangi .+ kali|untuk .+|(?:fungsi (?:asinkron )?|asinkron fungsi ).+\([^)]*\)(?:\s*:\s*[\p{L}_][\p{L}\p{N}_]*)?|kelas .+|uji .+|ketika .+|coba(?: tangkap(?: [\p{L}_][\p{L}\p{N}_]*)?)?)$/u.test(s);
  const branch=s=>s==='jika tidak'||/^atau jika .+ maka$/.test(s)||s==='tangkap'||s==='akhirnya';
  const selectBranch=s=>s==='lainnya'||/^kasus .+$/.test(s);
  function format(code){
    if(typeof code!=='string')throw Error('Kode harus berupa teks');
    let level=0,depth=0,quote=null,escaped=false;const stack=[],result=[];
    const raw=code.replace(/\r\n?/g,'\n').split('\n');
    for(let i=0;i<raw.length;i++){
      const line=raw[i].trim();if(!line){result.push('');continue}
      // Block keywords ignore inline comments, without treating # inside strings as a comment.
      let clean='',q=null,escape=false;
      for(const char of line){if(q){clean+=char;if(escape)escape=false;else if(char==='\\')escape=true;else if(char===q)q=null}else{if(char==='#')break;clean+=char;if(char==='"'||char==="'")q=char}}
      const structure=clean.trim().replace(/^ekspor\s+/,'');
      if(depth>0){result.push(' '.repeat((level+1)*4)+line)}
      else if(structure==='selesai'){
        const frame=stack.pop();if(!frame)throw Error(`Baris ${i+1}: selesai tanpa pembuka`);
        if(frame.kind==='pilih'&&frame.branch)level--;
        level=Math.max(0,level-1);result.push(' '.repeat(level*4)+line);
      }else if(selectBranch(structure)){
        const top=stack.at(-1);if(!top||top.kind!=='pilih')throw Error(`Baris ${i+1}: kasus/lainnya hanya di blok pilih`);
        if(top.branch)level--;
        result.push(' '.repeat(level*4)+line);level++;top.branch=true;
      }else if(branch(structure)){
        if(!stack.length)throw Error(`Baris ${i+1}: cabang tanpa blok`);
        level=Math.max(0,level-1);result.push(' '.repeat(level*4)+line);level++;
      }else{
        result.push(' '.repeat(level*4)+line);
        if(/^pilih .+$/.test(structure)){stack.push({kind:'pilih',branch:false});level++}
        else if(opens(structure)){stack.push({kind:'normal'});level++}
      }
      // Expression continuation: brackets across lines, ignoring comments and quoted content.
      for(const char of raw[i]){
        if(quote){if(escaped){escaped=false;continue}if(char==='\\'){escaped=true;continue}if(char===quote)quote=null;continue}
        if(char==='#')break;if(char==='"'||char==="'"){quote=char;continue}
        if('([{'.includes(char))depth++;else if(')]}'.includes(char))depth--;
      }
    }
    if(stack.length||depth!==0||quote)throw Error('Blok, kurung, atau string belum ditutup');
    // Idempotent indentation; remove extra blank lines at start and end.
    return result.join('\n').replace(/^\n+|\n+$/g,'')+'\n';
  }
  return {format};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=AksaraFormatter;
