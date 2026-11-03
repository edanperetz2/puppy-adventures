// Reproducible, pinned icon import. These illustrations are bundled offline.
import { EXPANDED_VOCABULARY } from '../dist/reading-expansion.js';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const supplemental={rose:'1f339',arrow:'27a1',unicorn:'1f984',xray:'1fa7b',jellyfish:'1fabc',jar:'1fad9'};
const entries=[...EXPANDED_VOCABULARY,...Object.entries(supplemental).map(([id,picture])=>({id,picture}))];
const records={},pictures={},downloaded=new Map(),missing=[];
let index=0;
await Promise.all(Array.from({length:5},async()=>{
  while(index<entries.length){
    const {id,picture}=entries[index++];
    const source=`https://raw.githubusercontent.com/jdecked/twemoji/v15.1.0/assets/svg/${picture}.svg`;
    if(!downloaded.has(source))downloaded.set(source,(async()=>{
      const response=await fetch(source);if(response.status===404)return null;if(!response.ok)throw Error(`${id}: ${response.status}`);
      const bytes=Buffer.from(await response.arrayBuffer()),svg=bytes.toString();
      if(!/^<svg\b/u.test(svg)||!svg.includes('viewBox="0 0 36 36"')||/<script|<foreignObject|href=/iu.test(svg))throw Error(`Unexpected icon: ${id}`);
      return {body:svg.replace(/^<svg\b[^>]*>/u,'').replace(/<\/svg>\s*$/u,''),sha256:createHash('sha256').update(bytes).digest('hex')};
    })());
    const icon=await downloaded.get(source);
    if(!icon){missing.push({id,picture});continue;}
    const {body,sha256}=icon;
    pictures[id]=`<g fill="#000" transform="translate(14 14) scale(4.77777778)">${body}</g>`;
    records[id]={picture,source,sha256};
  }
}));
await writeFile(new URL('../dist/expanded-art.js',import.meta.url),'// Twemoji v15.1.0, CC BY 4.0. See assets/Twemoji-LICENSE.txt.\nexport const EXPANDED_ART = '+JSON.stringify(Object.fromEntries(Object.entries(pictures).sort()),null,2)+';\n');
await writeFile(new URL('./expanded-art-sources.json',import.meta.url),JSON.stringify({release:'v15.1.0',license:'CC-BY-4.0',pictures:Object.fromEntries(Object.entries(records).sort())},null,2)+'\n');
console.log(`${Object.keys(pictures).length} named pictures imported. Missing icons need custom drawings: ${JSON.stringify(missing)}`);
