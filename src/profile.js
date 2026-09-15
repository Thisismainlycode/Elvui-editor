import luaparse from 'luaparse';
import { Decoder, Encoder } from 'cbor-x';
import { Inflate, Unzlib, deflateSync } from 'fflate';
import {decodeE1} from './legacy.js';

export const LIMIT=4*1024*1024;
export function get(root,path,fallback){let v=root;for(const k of path){if(!(v instanceof Map))return fallback;v=v.get(k);}return v===undefined?fallback:v;}
export function set(root,path,value){let t=root;for(const k of path.slice(0,-1)){if(!t.has(k))t.set(k,new Map());if(!(t.get(k) instanceof Map))throw Error(`Cannot edit ${path.join('.')}: existing data is not a table.`);t=t.get(k);}t.set(path.at(-1),value);}
export function clone(value){return structuredClone(value);}
function validKey(k){return typeof k==='string'||typeof k==='boolean'||(typeof k==='number'&&Number.isFinite(k));}
function fromAst(n,depth=0){
 if(depth>100)throw Error('This profile is nested too deeply.');
 if(n.type==='TableConstructorExpression'){const m=new Map();let i=1;for(const f of n.fields){let k;if(f.type==='TableKeyString')k=f.key.name;else if(f.type==='TableKey')k=fromAst(f.key,depth+1);else if(f.type==='TableValue')k=i++;else throw Error('Unsupported table entry.');if(!validKey(k))throw Error('Unsupported table key.');const v=fromAst(f.value,depth+1);if(v!==null)m.set(k,v);else m.delete(k);}return m;}
 if(n.type==='StringLiteral'){try{return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(n.value,c=>c.charCodeAt(0)));}catch{throw Error('A Lua string contains non-UTF-8 binary data. It cannot be safely edited in this version.');}}
 if(n.type==='NumericLiteral'){if(!Number.isFinite(n.value))throw Error('Non-finite numbers are not supported.');return n.value;}
 if(n.type==='BooleanLiteral')return n.value;
 if(n.type==='NilLiteral')return null;
 if(n.type==='UnaryExpression'&&n.operator==='-'&&n.argument.type==='NumericLiteral')return -fromAst(n.argument,depth+1);
 throw Error('Only saved data is supported. Lua code, function calls, and expressions are never executed.');
}
export function quote(s){return '"'+s.replace(/[\\"\x00-\x1f\x7f]/g,c=>c==='\\'?'\\\\':c==='"'?'\\"':'\\'+c.charCodeAt(0).toString().padStart(3,'0'))+'"';}
export function toLua(v,depth=0){
 if(depth>100)throw Error('Profile is nested too deeply.');
 if(v instanceof Map)return '{'+[...v].map(([k,x])=>{if(!validKey(k))throw Error('Unsupported table key.');return '['+toLua(k,depth+1)+']='+toLua(x,depth+1);}).join(',')+'}';
 if(typeof v==='string')return quote(v);
 if(typeof v==='number'&&Number.isFinite(v))return String(v);
 if(typeof v==='boolean')return String(v);
 throw Error('This profile contains a value that cannot safely be exported to Lua.');
}
function normalize(v,depth=0){if(depth>100)throw Error('Profile is nested too deeply.');if(v instanceof Map){let out=new Map();for(const [k,x]of v){if(!validKey(k))throw Error('Unsupported CBOR table key.');out.set(k,normalize(x,depth+1));}return out;}if(Array.isArray(v))return new Map(v.map((x,i)=>[i+1,normalize(x,depth+1)]));if(typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return v;throw Error('Unsupported CBOR value. Use an ElvUI Lua table export or saved settings file.');}
function inflateLimited(bytes,zlib){let chunks=[],total=0;const stream=new (zlib?Unzlib:Inflate)((part)=>{total+=part.length;if(total>LIMIT)throw Error('Decoded profile exceeds the 4 MB limit.');chunks.push(part);});for(let i=0;i<bytes.length;i+=256)stream.push(bytes.subarray(i,i+256),i+256>=bytes.length);let out=new Uint8Array(total),p=0;for(const c of chunks){out.set(c,p);p+=c.length;}return out;}
export function decodeE2(text){
 const s=text.slice(4).replace(/\s/g,'');if(!s||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid !E2! Base64 data.');
 let raw;try{raw=Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch{throw Error('Invalid !E2! Base64 data.');}
 let bytes;try{bytes=inflateLimited(raw,false);}catch(e){if(e.message.includes('limit'))throw e;try{bytes=inflateLimited(raw,true);}catch{throw Error('Could not decompress this profile. It may be incomplete or use an unsupported format.');}}
 const decoder=new Decoder({mapsAsObjects:false,useRecords:false});
 try{const profile=normalize(decoder.decode(bytes));if(profile instanceof Map)return {name:'Imported profile',profile,format:'E2'};}catch{}
 // Older exports append a name after the CBOR value.
 let marker=-1;const suffix=new TextEncoder().encode('::profile::');for(let i=bytes.length-suffix.length;i>=0;i--){if(suffix.every((c,j)=>bytes[i+j]===c)){marker=i;break;}}
 if(marker<0)throw Error('Could not read this !E2! profile. The data may be incomplete or use an unsupported format.');
 const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(marker+suffix.length));
 const profile=normalize(decoder.decode(bytes.subarray(0,marker)));
 if(!(profile instanceof Map))throw Error('The profile root must be a table.');return {name:name||'Imported profile',profile,format:'E2'};
}
export function exportProfile(profile,name,format='lua'){
 name=name.trim();if(!name||name.length>50||/[\x00-\x1f:]/.test(name))throw Error('Use a profile name of 1–50 characters without colons or control characters.');
 // Validate values even for CBOR, preventing accidental undefined/null conversion.
 const lua=toLua(profile);
 if(format==='lua')return `${lua.replace(/\|/g,'||')}::profile::${name}`;
 const data=new Encoder({useRecords:false,mapsAsObjects:false,structuredClone:false}).encode(profile);const suffix=new TextEncoder().encode('::profile::'+name),all=new Uint8Array(data.length+suffix.length);all.set(data);all.set(suffix,data.length);const compressed=deflateSync(all);let binary='';for(const b of compressed)binary+=String.fromCharCode(b);return '!E2!'+btoa(binary);
}
export function parseInput(input){
 const text=input.replace(/^\uFEFF/,'').trim();if(!text)throw Error('Paste a profile or choose an ElvUI.lua file.');if(new TextEncoder().encode(text).length>LIMIT)throw Error('The maximum import size is 4 MB.');
 if(text.startsWith('!E2!'))return {profiles:[decodeE2(text)]};
 if(text.startsWith('!E1!'))return {profiles:[decodeE1(text)]};
 let ast,name='Imported profile';let source=text;
 if(text.startsWith('{')){const match=text.match(/^([\s\S]+)::profile::([^\r\n]*)$/);if(match){source=match[1].replace(/\|\|/g,'|');name=match[2]||name;}else if(/::(private|global|filters)$/.test(text))throw Error('Import a character profile rather than Global, Private, or Filters settings.');source='return '+source;}
 let byteSource='';for(const b of new TextEncoder().encode(source))byteSource+=String.fromCharCode(b);
 try{ast=luaparse.parse(byteSource,{luaVersion:'5.1',encodingMode:'pseudo-latin1',comments:false,scope:false,locations:false});}catch(e){throw Error('Could not read this Lua data. Use a complete ElvUI.lua saved settings file or a Lua table profile export. '+e.message);}
 if(ast.body.length===1&&ast.body[0].type==='ReturnStatement'&&ast.body[0].arguments.length===1){const profile=fromAst(ast.body[0].arguments[0]);if(!(profile instanceof Map))throw Error('Expected a profile table.');return {profiles:[{name,profile,format:'Lua'}]};}
 let elv;
 for(const stmt of ast.body){if(stmt.type!=='AssignmentStatement'||stmt.variables.length!==1||stmt.variables[0].type!=='Identifier'||stmt.init.length!==1)throw Error('This file contains executable Lua. Only saved-variable assignments are accepted.');const v=fromAst(stmt.init[0]);if(stmt.variables[0].name==='ElvDB')elv=v;}
 const profiles=get(elv,['profiles']);if(!(profiles instanceof Map)||profiles.size===0)throw Error('No ElvDB.profiles found. Choose the account SavedVariables/ElvUI.lua file.');
 const out=[...profiles].map(([name,profile])=>{if(typeof name!=='string'||!(profile instanceof Map))throw Error('Invalid profile entry in saved settings.');return {name,profile,format:'SavedVariables'};});return {profiles:out};
}
