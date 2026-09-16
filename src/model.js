import {get,set,clone} from './profile.js';
export const ANCHORS=['TOPLEFT','TOP','TOPRIGHT','LEFT','CENTER','RIGHT','BOTTOMLEFT','BOTTOM','BOTTOMRIGHT'];
const unit=(id,label,mover,x,y,w=270,h=54)=>({id,label,mover,kind:id,path:['unitframe','units',id],w,h,x,y,resize:true,enable:true});
const DEFAULT_ENABLED_BARS=new Set([1,3,4,5]);
const bar=(n,x=0,y=-370)=>({id:`bar${n}`,label:`Action bar ${n}`,mover:`ElvAB_${n}`,kind:'bar',path:['actionbar',`bar${n}`],x,y,w:406,h:32,enable:true,enableKey:'enabled',defaultEnabled:DEFAULT_ENABLED_BARS.has(n),defaultButtons:n===3||n===5?6:12,defaultCols:n===4?1:n===3||n===5?6:12,defaultBackdrop:n===4});
export const ACTION_BAR_IDS=[1,2,3,4,5,6,7,8,9,10,13,14,15];
const BENIKUI_PORTRAITS=[['player','Player'],['target','Target'],['targettarget','Target target'],['focus','Focus'],['pet','Pet']];
const BENIKUI_DASHBOARDS=[
 ['system','BuiDashboardMover','System dashboard',150],['tokens','tokenHolderMover','Tokens dashboard',150],
 ['professions','ProfessionsMover','Professions dashboard',150],['reputations','reputationHolderMover','Reputations dashboard',200],
 ['items','itemsHolderMover','Items dashboard',150]
];
const BASE_DEFINITIONS=[unit('player','Player','ElvUF_PlayerMover',-320,-180),unit('target','Target','ElvUF_TargetMover',320,-180),unit('focus','Focus','ElvUF_FocusMover',-320,-95,180,36),unit('pet','Pet','ElvUF_PetMover',-320,-250,180,30),bar(1),bar(2,0,-326),{id:'minimap',label:'Minimap',mover:'MinimapMover',kind:'minimap',path:['general','minimap'],x:805,y:380,w:170,h:170,resize:true},{id:'leftchat',label:'Left chat',mover:'LeftChatMover',kind:'chat',x:-725,y:-355,w:400,h:180},{id:'rightchat',label:'Right chat',mover:'RightChatMover',kind:'chat',x:725,y:-355,w:400,h:180},{id:'raid1',label:'Raid group',mover:'ElvUF_Raid1Mover',kind:'raid',path:['unitframe','units','raid1'],x:-745,y:0,w:300,h:190}];
export const DEFINITIONS=[...BASE_DEFINITIONS];
export function newProfile(){const p=new Map();for(const d of DEFINITIONS){set(p,['movers',d.mover],`CENTER,UIParent,CENTER,${d.x},${d.y}`);if(d.enable)set(p,[...d.path,d.enableKey||'enable'],true);if(d.resize){if(d.kind==='minimap')set(p,[...d.path,'size'],d.w);else{set(p,[...d.path,'width'],d.w);set(p,[...d.path,'height'],d.h);}}if(d.kind==='bar'){set(p,[...d.path,'buttons'],d.defaultButtons);set(p,[...d.path,'buttonsPerRow'],d.defaultCols);set(p,[...d.path,'buttonSize'],32);set(p,[...d.path,'buttonSpacing'],2);}}set(p,['chat','panelWidth'],400);set(p,['chat','panelHeight'],180);return p;}
export function anchorFraction(a){return [a.includes('LEFT')?0:a.includes('RIGHT')?1:.5,a.includes('TOP')?0:a.includes('BOTTOM')?1:.5];}
export function parseMover(value){if(typeof value!=='string')return null;const [anchor,parent,relative,x,y,...rest]=value.split(value.includes('\x1f')?'\x1f':',');if(rest.length||!ANCHORS.includes(anchor)||!ANCHORS.includes(relative)||!parent||!Number.isFinite(Number(x))||!Number.isFinite(Number(y)))return null;return {anchor,parent,relative,x:Number(x),y:Number(y)};}
export function actionBarLayout(p,d){const path=d.path,n=get(p,[...path,'buttons'],d.defaultButtons),cols=Math.max(1,Math.min(n,get(p,[...path,'buttonsPerRow'],d.defaultCols))),size=get(p,[...path,'buttonSize'],32),height=get(p,[...path,'keepSizeRatio'],true)===false?get(p,[...path,'buttonHeight'],32):size,gap=get(p,[...path,'buttonSpacing'],2),rows=Math.ceil(n/cols),w=cols*size+(cols-1)*gap,h=rows*height+(rows-1)*gap,backdrop=get(p,[...path,'backdrop'],d.defaultBackdrop??false),inset=backdrop?get(p,[...path,'backdropSpacing'],2):0;return {n,cols,size,height,gap,rows,w,h,backdrop,inset,moverW:w+inset*2,moverH:h+inset*2};}
export function dimensions(p,d){
 let w=d.w,h=d.h;let path=d.dimensionPath||d.path;
 if(d.kind==='bar')({w,h}=actionBarLayout(p,d));
 else if(d.kind==='minimap')w=h=get(p,[...path,'size'],170);
 else if(d.kind==='chat'){const right=d.id==='rightchat'&&get(p,['chat','separateSizes'],false);w=get(p,['chat',right?'panelWidthRight':'panelWidth'],400);h=get(p,['chat',right?'panelHeightRight':'panelHeight'],180);}
 else if(d.resize){w=get(p,[...path,d.widthKey||'width'],w);h=get(p,[...path,d.heightKey||'height'],h);}
 return {w:typeof w==='number'&&w>0?Math.min(w,8000):d.w,h:typeof h==='number'&&h>0?Math.min(h,8000):d.h};
}
function benikUIDashboardHeight(p,key){
 const path=['benikui','dashboards',key],orientation=get(p,[...path,'orientation'],'BOTTOM'),spacing=get(p,[...path,'spacing'],1);
 let rows=1;
 if(key==='system'){
  const choices=get(p,[...path,'chooseSystem']);
  rows=choices instanceof Map?[...choices.values()].filter(Boolean).length:5;
 }
 return orientation==='BOTTOM'?23*Math.max(1,rows)+3:23;
}
function benikUIDefinitions(p){
 const movers=get(p,['movers']),bui=get(p,['benikui']),hasBui=bui instanceof Map,defs=[];
 const add=d=>{if(hasBui||get(movers,[d.mover])!==undefined)defs.push({...d,plugin:'BenikUI'});};
 for(const [unitId,label] of BENIKUI_PORTRAITS){const path=['benikui','unitframes',unitId],dimensionPath=unitId==='target'&&get(p,[...path,'getPlayerPortraitSize'],true)!==false?['benikui','unitframes','player']:path;add({id:`benikui-portrait-${unitId}`,label:`${label} portrait`,mover:`${unitId==='targettarget'?'TargetTarget':label}PortraitMover`,kind:'benikui',subkind:'portrait',path,dimensionPath,widthKey:'portraitWidth',heightKey:'portraitHeight',enable:true,enableKey:'detachPortrait',defaultEnabled:false,resize:true,w:110,h:85,x:unitId==='player'?-460:460,y:-180});}
 for(const [key,mover,label,width] of BENIKUI_DASHBOARDS){const path=['benikui','dashboards',key],orientation=get(p,[...path,'orientation'],'BOTTOM'),rows=key==='system'?(get(p,[...path,'chooseSystem'])instanceof Map?[...get(p,[...path,'chooseSystem']).values()].filter(Boolean).length:5):1,w=get(p,[...path,'width'],width),h=benikUIDashboardHeight(p,key);add({id:`benikui-dashboard-${key}`,label,mover,kind:'benikui',subkind:'dashboard',path,enable:true,defaultEnabled:true,w:orientation==='BOTTOM'?w:w*Math.max(1,rows)+(Math.max(1,rows)-1)*get(p,[...path,'spacing'],1),h,x:-750,y:360});}
 add({id:'benikui-request-stop',label:'Request stop button',mover:'RequestStopButton',kind:'benikui',subkind:'button',path:['benikui','actionbars'],enable:true,enableKey:'requestStop',defaultEnabled:true,w:240,h:40,x:0,y:390});
 for(const [key,mover,label,y] of [['mawBar','BUIMawBarMover','Maw bar',365],['preyBar','BUIPreyBarMover','Prey bar',390]])add({id:`benikui-${key}`,label,mover,kind:'benikui',subkind:'widgetbar',path:['benikui','widgetbars',key],enable:true,defaultEnabled:true,resize:true,w:get(p,['benikui','widgetbars',key,'width'],222),h:get(p,['benikui','widgetbars',key,'height'],5),x:0,y});
 if(bui instanceof Map){const panels=get(bui,['panels']);if(panels instanceof Map)for(const [name,data]of panels){if(typeof name!=='string'||!(data instanceof Map))continue;defs.push({id:`benikui-panel-${name}`,label:name.replace(/^BenikUI_/,''),mover:`${name}_Mover`,kind:'benikui',subkind:'panel',plugin:'BenikUI',path:['benikui','panels',name],enable:true,defaultEnabled:true,resize:true,w:get(data,['width'],200),h:get(data,['height'],200),x:-600,y:0});}}
 return defs;
}
export function framesFor(p,viewport){
 const defs=[...DEFINITIONS],movers=get(p,['movers']);for(const n of ACTION_BAR_IDS.slice(2)){const d=bar(n,n===4?900:n>=6?850:0,n===3?-280:n===4?0:n===5?-370:140+(n-6)*38);if(get(p,d.path)instanceof Map||get(p,['movers',d.mover])!==undefined)defs.splice(4+n,0,d);}defs.push(...benikUIDefinitions(p));if(movers instanceof Map)for(const [m]of movers)if(typeof m==='string'&&!defs.some(d=>d.mover===m)){const label=m.replace(/Mover$/,'').replace(/[_-]+/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').trim()||m;defs.push({id:m,label,kind:'anchor',mover:m,w:12,h:12,x:0,y:0,anchorOnly:true});}
 const frames=defs.map(d=>{const raw=get(p,['movers',d.mover]),dims=dimensions(p,d),layout=d.kind==='bar'?actionBarLayout(p,d):null;return {...d,...dims,moverW:layout?.moverW??dims.w,moverH:layout?.moverH??dims.h,inset:layout?.inset??0,enabled:d.enable?get(p,[...d.path,d.enableKey||'enable'],d.defaultEnabled??true)!==false:true,moverData:parseMover(raw),raw,estimated:raw===undefined};});
 const roots=['UIParent','ElvUIParent'];
 function resolve(f,seen=new Set()){
  if(f.anchorRect)return f.anchorRect;if(seen.has(f.id)){f.warning='Circular relative anchor; position editing is unavailable.';return null;}seen.add(f.id);
  let m=f.moverData;if(!m){if(f.raw!==undefined){f.warning='Unrecognized mover format; retained without changes.';return null;}m={anchor:'CENTER',parent:'UIParent',relative:'CENTER',x:f.x,y:f.y};}
  let parent;if(roots.includes(m.parent))parent={left:0,top:0,w:viewport.w,h:viewport.h};else{const other=frames.find(x=>x.mover===m.parent);if(other)parent=resolve(other,seen);}
  if(!parent){f.warning=f.warning||`Relative frame ${m.parent} cannot be previewed. Position is retained.`;return null;}
  const a=anchorFraction(m.anchor),b=anchorFraction(m.relative),anchorX=parent.left+parent.w*b[0]+m.x,anchorY=parent.top+parent.h*b[1]-m.y;if(f.anchorOnly){const left=anchorX-f.w/2,top=anchorY-f.h/2;f.anchorRect=f.rect={left,top,w:f.w,h:f.h};return f.anchorRect;}const left=anchorX-f.moverW*a[0],top=anchorY-f.moverH*a[1];f.anchorRect={left,top,w:f.moverW,h:f.moverH};f.rect={left:left+f.inset,top:top+f.inset,w:f.w,h:f.h};return f.anchorRect;
 }
 for(const f of frames)resolve(f);return frames;
}
export function moveFrame(p,f,left,top,viewport){if(f.warning)throw Error(f.warning);const x=Math.round(left+f.w/2-viewport.w/2),y=Math.round(viewport.h/2-top-f.h/2);set(p,['movers',f.mover],`CENTER,UIParent,CENTER,${x},${y}`);}
export function resizeFrame(p,f,w,h){if(!f.resize)throw Error('This frame does not support resizing.');if(!Number.isFinite(w)||!Number.isFinite(h)||w<10||h<10||w>2000||h>2000)throw Error('Dimensions must be between 10 and 2000 UI units.');const path=f.dimensionPath||f.path;if(f.kind==='minimap')set(p,[...path,'size'],Math.round(w));else{set(p,[...path,f.widthKey||'width'],Math.round(w));set(p,[...path,f.heightKey||'height'],Math.round(h));}}
export {get,set,clone};
