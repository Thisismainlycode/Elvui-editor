import {Inflate} from 'fflate';

const alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()';
const LIMIT=4*1024*1024;

function decodePrint(text){
 const out=[];let bits=0,cache=0;
 for(const char of text){const n=alphabet.indexOf(char);if(n<0)throw Error('Invalid !E1! printable data.');cache|=n<<bits;bits+=6;if(bits>=8){out.push(cache&255);cache>>>=8;bits-=8;}}
 if(bits&&cache)throw Error('Invalid !E1! padding.');
 return Uint8Array.from(out);
}
function inflateLimited(input){let chunks=[],length=0;const stream=new Inflate(part=>{length+=part.length;if(length>LIMIT)throw Error('Decoded profile exceeds the 4 MB limit.');chunks.push(part);});for(let i=0;i<input.length;i+=256)stream.push(input.subarray(i,i+256),i+256>=input.length);const out=new Uint8Array(length);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}return out;}
function unescapeAce(s){const bytes=[];for(let i=0;i<s.length;i++){let n=s.charCodeAt(i);if(n===126){if(++i>=s.length)throw Error('Incomplete AceSerializer escape.');n=s.charCodeAt(i);n=n===122?30:n===123?127:n===124?126:n===125?94:n-64;if(n<0||n>127)throw Error('Invalid AceSerializer escape.');}bytes.push(n);}return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bytes));}
function deserializeAce(source){
 let i=0,nodes=0;const token=()=>{if(source[i++]!=='^'||i>=source.length)throw Error('Invalid AceSerializer token.');const kind=source[i++];if(kind==='^')return {kind};const end=source.indexOf('^',i);if(end<0)throw Error('Incomplete AceSerializer data.');const data=source.slice(i,end);i=end;return {kind,data};};
 if(token().kind!=='1')throw Error('Unsupported AceSerializer version.');
 function value(t,depth=0){if(++nodes>100000||depth>100)throw Error('Profile is too large or nested too deeply.');switch(t.kind){
  case 'S':return unescapeAce(t.data);
  case 'N':{const n=Number(t.data);if(!Number.isFinite(n))throw Error('Invalid AceSerializer number.');return n;}
  case 'F':{const e=token();if(e.kind!=='f')throw Error('Invalid AceSerializer float.');const n=Number(t.data)*2**Number(e.data);if(!Number.isFinite(n))throw Error('Invalid AceSerializer float.');return n;}
  case 'B':return true;case 'b':return false;
  case 'T':{const map=new Map();while(true){const k=token();if(k.kind==='t')return map;const key=value(k,depth+1);if(typeof key!=='string'&&typeof key!=='boolean'&&!(typeof key==='number'&&Number.isFinite(key)))throw Error('Unsupported AceSerializer table key.');map.set(key,value(token(),depth+1));}}
  default:throw Error('Unsupported AceSerializer value.');
 }}
 const profile=value(token());if(!(profile instanceof Map)||token().kind!=='^'||i!==source.length)throw Error('Invalid !E1! profile table.');return profile;
}
export function decodeE1(text){const encoded=text.slice(4).replace(/\s/g,'');if(!encoded)throw Error('Empty !E1! profile.');let data;try{data=inflateLimited(decodePrint(encoded));}catch(e){if(e.message.includes('limit'))throw e;throw Error('Could not decompress this !E1! profile.');}
 const source=new TextDecoder('utf-8',{fatal:true}).decode(data);const marker=source.lastIndexOf('^^::profile::');if(marker<0)throw Error('Only character profiles can be upgraded from !E1!.');const name=source.slice(marker+13);const profile=deserializeAce(source.slice(0,marker+2));return {name:name||'Imported profile',profile,format:'E1'};
}
