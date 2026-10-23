 'use strict';
(()=>{
 const source=document.getElementById('source');if(!source||typeof AksaraLanguageTools==='undefined')return;
 const make=(tag,cls)=>{const el=document.createElement(tag);el.className=cls;return el};
 const pop=make('div','aksara-completion hidden');pop.setAttribute('role','listbox');
 document.querySelector('.codeArea').append(pop);
 function word(){const before=source.value.slice(0,source.selectionStart);return /[\p{L}_][\p{L}\p{N}_]*$/u.exec(before)?.[0]||''}
 function insert(label){const before=source.value.slice(0,source.selectionStart),after=source.value.slice(source.selectionEnd);const match=/[\p{L}_][\p{L}\p{N}_]*$/u.exec(before);const start=source.selectionStart-(match?.[0].length||0);source.value=source.value.slice(0,start)+label+after;source.setSelectionRange(start+label.length,start+label.length);source.dispatchEvent(new Event('input',{bubbles:true}));source.focus();pop.classList.add('hidden')}
 function completion(){pop.replaceChildren();const suggestions=AksaraLanguageTools.suggest(word());for(const suggestion of suggestions){const button=make('button','aksara-suggestion');button.type='button';const name=make('strong','');name.textContent=suggestion.label;const detail=make('span','');detail.textContent=suggestion.detail;button.append(name,detail);button.onmousedown=e=>{e.preventDefault();insert(suggestion.label)};pop.append(button)}pop.classList.toggle('hidden',!suggestions.length)}
 function selectedWord(){const at=source.selectionStart;return AksaraLanguageTools.tokens(source.value).find(t=>t.start<=at&&at<=t.end)?.name||''}
 function jump(){const name=selectedWord();const location=AksaraLanguageTools.findDefinition(source.value,name);if(!location){alert('Deklarasi '+name+' belum ditemukan pada berkas ini.');return}const rows=source.value.split('\n');const pos=rows.slice(0,location.line-1).reduce((sum,s)=>sum+s.length+1,0)+location.column-1;source.focus();source.setSelectionRange(pos,pos+name.length);source.scrollTop=Math.max(0,(location.line-4)*25)}
 function rename(){const old=selectedWord();if(!old)return;const next=prompt('Ganti semua token bernama '+old+' di berkas aktif (bukan refactor antar modul):',old);if(!next||next===old)return;try{const result=AksaraLanguageTools.rename(source.value,old,next);source.value=result.source;source.dispatchEvent(new Event('input',{bubbles:true}));alert(result.count+' token diubah. Periksa kembali scope sebelum disimpan.')}catch(e){alert(e.message)}}
 source.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.code==='Space'){e.preventDefault();completion()}else if(e.key==='F12'){e.preventDefault();jump()}else if(e.key==='F2'){e.preventDefault();rename()}else if(e.key==='Escape'){pop.classList.add('hidden')}},true);
 source.addEventListener('input',()=>pop.classList.add('hidden'));
 document.addEventListener('pointerdown',e=>{if(!pop.contains(e.target))pop.classList.add('hidden')});
})();
