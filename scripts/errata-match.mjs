// Resolve incoming errata crop filenames -> {id, name, face} by fuzzy name match.
// Usage: node scripts/errata-match.mjs            (scans the drop folder)
//        node scripts/errata-match.mjs "veers"    (test a single name)
import fs from 'fs';
const DROP='tmp/errata-2026-05/incoming';
const chars=JSON.parse(fs.readFileSync('public/data/characters.json','utf8'));
const list=Array.isArray(chars)?chars:Object.values(chars);
const norm=s=>s.toLowerCase()
  .replace(/\.(png|jpg|jpeg|webp)$/,'')
  .replace(/[_-]/g,' ')
  .replace(/["'`’.,()]/g,'').replace(/î/g,'i').replace(/é/g,'e')
  .replace(/\band\b/g,'').replace(/\s+/g,' ').trim();
function resolve(raw){
  let face=null;
  const m=raw.match(/_(back|front|s1|s2|stance1|stance2|stance)$/i)||raw.replace(/\.(png|jpg|jpeg|webp)$/,'').match(/_(back|front|s1|s2|stance1|stance2|stance)$/i);
  let namePart=raw.replace(/\.(png|jpg|jpeg|webp)$/,'');
  const fm=namePart.match(/_(back|front|s1|s2|stance1|stance2|stance)$/i);
  if(fm){face=fm[1].toLowerCase().replace('stance1','s1').replace('stance2','s2').replace(/^stance$/,'s1'); namePart=namePart.slice(0,fm.index);}
  const n=norm(namePart);
  // exact, then startsWith, then includes, then token-overlap score
  let cand=list.filter(c=>norm(c.name)===n);
  if(!cand.length) cand=list.filter(c=>norm(c.name).startsWith(n)||n.startsWith(norm(c.name)));
  if(!cand.length) cand=list.filter(c=>norm(c.name).includes(n)||n.includes(norm(c.name)));
  if(!cand.length){
    const nt=new Set(n.split(' '));
    cand=list.map(c=>{const ct=norm(c.name).split(' ');const ov=ct.filter(t=>nt.has(t)).length;return{c,ov};})
      .filter(x=>x.ov>0).sort((a,b)=>b.ov-a.ov).slice(0,3).map(x=>x.c);
  }
  return {face, n, cand};
}
const arg=process.argv[2];
if(arg){const r=resolve(arg);console.log(arg,'->',r.cand.map(c=>`${c.id}:${c.name}`).join(' | ')||'NO MATCH', r.face?`[${r.face}]`:'');process.exit(0);}
const files=fs.existsSync(DROP)?fs.readdirSync(DROP).filter(f=>/\.(png|jpg|jpeg|webp)$/i.test(f)):[];
if(!files.length){console.log('(drop folder empty:',DROP+')');process.exit(0);}
for(const f of files){const r=resolve(f);const c=r.cand[0];const amb=r.cand.length>1?`  ⚠ AMBIGUOUS: ${r.cand.map(x=>x.id+':'+x.name).join(', ')}`:'';
  console.log(`${f}  ->  ${c?`id=${c.id} ${c.name}`:'❌ NO MATCH'} [${r.face||'?face'}]${amb}`);}
