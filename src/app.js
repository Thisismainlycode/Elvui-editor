import {parseInput,exportProfile,LIMIT} from './profile.js';
import {newProfile,framesFor,moveFrame,resizeFrame,swapBars,actionBarLayout,get,set,clone,ANCHORS} from './model.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile=newProfile(),name='My next adventure',selected='player',group=new Set(['player']),source='New layout',dirty=false,history=[],future=[],frames=[],drag=null,marquee=null,applyProperties=()=>true;
const viewport=()=>{const [w,h]=$('#resolution').value.split(',').map(Number),scale=Number($('#ui-scale').value);return {w:w/scale,h:h/scale};};
const status=message=>$('#status').textContent=message;
const snapshot=()=>({profile:clone(profile),name,selected,group:new Set(group),source,dirty});
function pushHistory(){history.push(snapshot());if(history.length>70)history.shift();future=[];dirty=true;}
function restore(s){({profile,name,selected,group,source,dirty}=s);$('#profile-name').value=name;render();}
function mutate(fn,msg='Layout updated'){const old=snapshot(),oldFuture=future;try{pushHistory();fn();render();status(msg);}catch(e){history.pop();future=oldFuture;restore(old);status(e.message);}}
function undo(){if(!history.length)return;future.push(snapshot());restore(history.pop());status('Change undone');}
function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());status('Change restored');}
function selectedFrame(){return frames.find(f=>f.id===selected);}
function groupFrames(){return [...group].map(id=>frames.find(f=>f.id===id)).filter(Boolean);}
function draggableGroupFrames(){return groupFrames().filter(f=>f.rect&&!f.warning);}
function groupBBox(members){const lefts=members.map(m=>m.rect.left),tops=members.map(m=>m.rect.top),rights=members.map(m=>m.rect.left+m.w),bottoms=members.map(m=>m.rect.top+m.h),left=Math.min(...lefts),top=Math.min(...tops);return {left,top,w:Math.max(...rights)-left,h:Math.max(...bottoms)-top};}
function render(){
 const view=viewport();frames=framesFor(profile,view);if(!selectedFrame())selected=frames[0].id;
 const showCustom=$('#show-unsupported').checked,custom=frames.filter(f=>f.kind==='anchor'),visible=showCustom?frames:frames.filter(f=>f.kind!=='anchor');if(!visible.some(f=>f.id===selected))selected=visible[0]?.id||frames[0].id;
 for(const id of [...group])if(!visible.some(f=>f.id===id))group.delete(id);
 if(!group.size)group.add(selected);if(!group.has(selected))selected=[...group][0];
 const active=visible.filter(f=>f.enabled),off=visible.length-active.length;$('#count').textContent=`${active.length} visible${off?` · ${off} off`:''}${custom.length&&!showCustom?` · ${custom.length} custom`:''}${group.size>1?` · ${group.size} selected`:''}`;$('#profile-status').textContent=source+(dirty?' · Edited':'');$('#undo').disabled=!history.length;$('#redo').disabled=!future.length;
 $('#layers').innerHTML=visible.map(f=>`<button class="layer ${f.id===selected?'active':group.has(f.id)?'grouped':''}" data-id="${esc(f.id)}" aria-pressed="${group.has(f.id)}"><span>${esc(f.label)}</span><small>${f.warning?'!':f.enabled?'◇':'off'}</small></button>`).join('');
 $('#stage').style.aspectRatio=`${view.w}/${view.h}`;$('#stage').style.width=`${$('#canvas-zoom').value}%`;$('#stage').style.backgroundSize=`${40/view.w*100}% ${40/view.h*100}%`;$('#stage').classList.toggle('no-grid',!$('#grid').checked);
 $('#frames').innerHTML=active.filter(f=>f.rect).map(f=>{
 let body=`<span class="fill"></span><span class="frame-text">${esc(f.label)}</span><span class="frame-text">100%</span>`;
 let style=`left:${f.rect.left/view.w*100}%;top:${f.rect.top/view.h*100}%;width:${f.w/view.w*100}%;height:${f.h/view.h*100}%;opacity:${f.enabled?1:.32};`;
 if(f.kind==='bar'){const {n,cols,rows}=actionBarLayout(profile,f);body=Array.from({length:n},(_,i)=>`<span class="slot">${i<9?i+1:i===9?'0':i===10?'-':'='}</span>`).join('');style+=`grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);`;}
 if(f.kind==='raid')body=Array.from({length:25},()=>'<span class="raid-cell"></span>').join('');
 if(['chat','minimap','anchor','benikui'].includes(f.kind))body=`<span class="frame-text">${esc(f.label)}</span>`;
 const cls=f.id===selected?'selected':group.has(f.id)?'group-selected':'';
 return `<button class="frame ${f.kind} ${f.resize&&f.kind!=='minimap'?'power':''} ${cls}" data-id="${esc(f.id)}" data-label="${esc(f.label)}" style="${style}" aria-label="${esc(f.label)}, drag or use arrow keys to move">${body}${f.id===selected&&f.resize&&group.size<=1?'<span class="handle" aria-hidden="true"></span>':''}</button>`;
 }).join('');renderProperties();
}
const field=(label,id,value,min=-99999,max=99999)=>`<label class="field">${label}<input id="${id}" type="number" min="${min}" max="${max}" step="1" value="${Number(value)}" required></label>`;
function renderGroupProperties(){
 const members=groupFrames(),movable=members.filter(f=>f.rect&&!f.warning);
 $('#frame-title').textContent=`${members.length} frames selected`;$('#frame-kind').textContent='GROUP';$('#frame-description').textContent='Drag any selected frame on the canvas to move the group together.';
 $('#properties').innerHTML=`<div class="property-group"><h2>SELECTED</h2><p class="muted">${esc(members.map(f=>f.label).join(', '))}</p></div><div class="property-group"><h2>GROUP MOVE</h2><p class="muted">Drag any of the selected frames to move all ${movable.length} of them together, keeping their relative positions. Snapping (if enabled) aligns the group as one unit using its overall bounding box and center point, not each frame separately.</p>${movable.length<members.length?`<p class="muted">${members.length-movable.length} selected frame(s) have no adjustable position and won't move with the group.</p>`:''}</div><button id="clear-group" type="button">Clear selection</button>`;
 $('#selection-coords').textContent=`${movable.length} of ${members.length} movable`;
 applyProperties=()=>true;
 $('#clear-group').onclick=()=>{group=new Set([selected]);render();};
}
function renderProperties(){
 if(group.size>1){renderGroupProperties();return;}
 const f=selectedFrame(),m=f.moverData||{anchor:'CENTER',parent:'UIParent',relative:'CENTER',x:f.x,y:f.y};
 $('#frame-title').textContent=f.label;$('#frame-kind').textContent=f.kind==='anchor'?(f.plugin?`${f.plugin.toUpperCase()} ANCHOR`:'CUSTOM ANCHOR'):f.plugin?f.plugin.toUpperCase():f.kind.toUpperCase();$('#frame-description').textContent=f.kind==='anchor'?(f.plugin?`${f.plugin} ${f.subkind} · dynamic footprint`:'Editable anchor · frame size is not simulated'):f.kind==='benikui'?`BenikUI ${f.subkind} · source-backed footprint`:f.estimated?'Estimated position · no saved mover':f.kind==='raid'?'Approximate group footprint':'Position and dimensions';
 let html='';if(f.warning)html+=`<p class="readonly-note">${esc(f.warning)}</p>`;
 else html+=`<div class="property-group"><h2>POSITION · UI UNITS</h2><div class="field-row">${field('X offset','prop-x',m.x)}${field('Y offset','prop-y',m.y)}</div><label class="field">Frame anchor<select id="prop-anchor">${ANCHORS.map(a=>`<option ${a===m.anchor?'selected':''}>${a}</option>`).join('')}</select></label><p class="anchor-code">Relative to ${esc(m.parent)} · ${esc(m.relative)}<br>Positive Y moves upward.</p></div>`;
 if(f.resize)html+=`<div class="property-group"><h2>DIMENSIONS</h2><div class="field-row">${field(f.kind==='minimap'?'Size':'Width','prop-width',f.w,10,2000)}${f.kind==='minimap'?'':field('Height','prop-height',f.h,10,2000)}</div></div>`;
 if(f.kind==='bar')html+=`<div class="property-group"><h2>BUTTON LAYOUT</h2><div class="field-row">${field('Buttons','prop-buttons',get(profile,[...f.path,'buttons'],12),1,12)}${field('Per row','prop-cols',get(profile,[...f.path,'buttonsPerRow'],12),1,12)}${field('Size','prop-size',get(profile,[...f.path,'buttonSize'],34),16,100)}${field('Spacing','prop-gap',get(profile,[...f.path,'buttonSpacing'],2),0,30)}</div></div>`;
 if(f.kind==='bar'){const others=frames.filter(x=>x.kind==='bar'&&x.id!==f.id);if(others.length)html+=`<div class="property-group"><h2>SWAP</h2><label class="field">Swap with<select id="prop-swap-target">${others.map(o=>`<option value="${esc(o.id)}">${esc(o.label)}</option>`).join('')}</select></label><p class="muted">Exchanges position and button layout (buttons, columns, size, spacing, visibility) between these two bars. Keybinds live in your WoW account, not this profile, so they stay where they are.</p><button id="swap-bars" type="button">Swap bars</button></div>`;}
 if(f.kind==='chat')html+='<p class="muted">Chat panel size is previewed from your profile. This version edits its position only.</p>';
 if(f.kind==='raid')html+='<p class="muted">The group footprint is a placeholder. Only its saved mover position is editable.</p>';if(f.kind==='anchor')html+=`<p class="muted">This marker represents the exact saved anchor point. ${f.plugin?'Its size depends on live game or character data, so the editor does not invent a panel footprint.':'The add-on frame size is unknown, so no panel footprint is invented.'}</p>`;
 if(f.enable)html+=`<div class="property-group"><label class="check" style="margin:0"><input id="prop-enable" type="checkbox" ${f.enabled?'checked':''}> Enable frame in ${f.plugin||'ElvUI'}</label></div>`;
 html+=`<button id="apply-properties" style="margin-top:20px">Apply properties</button><div class="property-group"><h2>PROFILE SETTING</h2><code class="anchor-code">movers.${esc(f.mover)}</code></div>`;
 $('#properties').innerHTML=html;$('#selection-coords').textContent=f.rect?`${Math.round(f.w)} × ${Math.round(f.h)} UI units`:'Position unavailable';
 const inputs=[...$('#properties').querySelectorAll('input,select')].filter(el=>el.id!=='prop-swap-target');
 const value=input=>input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;
 const initial=new Map(inputs.map(input=>[input.id,value(input)]));
 applyProperties=()=>{
  if(inputs.some(input=>!input.checkValidity())){status('Enter a valid number within the displayed range.');inputs.find(input=>!input.checkValidity())?.reportValidity();return false;}
  const changed=inputs.filter(input=>value(input)!==initial.get(input.id));if(!changed.length)return true;
  const values=new Map(inputs.map(input=>[input.id,value(input)]));
  mutate(()=>{
   if(changed.some(input=>['prop-x','prop-y','prop-anchor'].includes(input.id)))set(profile,['movers',f.mover],`${values.get('prop-anchor')},${m.parent},${m.relative},${values.get('prop-x')},${values.get('prop-y')}`);
   if(changed.some(input=>['prop-width','prop-height'].includes(input.id)))resizeFrame(profile,f,values.get('prop-width'),values.get('prop-height')??f.h);
   for(const input of changed){const id=input.id;if(id==='prop-enable')set(profile,[...f.path,f.enableKey||'enable'],values.get(id));const key={'prop-buttons':'buttons','prop-cols':'buttonsPerRow','prop-size':'buttonSize','prop-gap':'buttonSpacing'}[id];if(key)set(profile,[...f.path,key],values.get(id));}
  },`${f.label} updated`);return true;
 };
 $('#apply-properties').onclick=()=>applyProperties();
 for(const input of inputs)input.addEventListener('change',()=>applyProperties());
 if($('#swap-bars'))$('#swap-bars').onclick=()=>{const target=frames.find(x=>x.id===$('#prop-swap-target').value);if(!target)return;mutate(()=>swapBars(profile,f,target),`${f.label} and ${target.label} swapped`);};
}
$('#layers').addEventListener('click',e=>{
 const b=e.target.closest('[data-id]');if(!b)return;if(!applyProperties())return;
 const id=b.dataset.id;
 if(e.ctrlKey||e.metaKey||e.shiftKey){
  if(group.has(id)&&group.size>1)group.delete(id);else group.add(id);
  selected=group.has(id)?id:[...group][0];
 }else{group=new Set([id]);selected=id;}
 render();
});
$('#frames').addEventListener('pointerdown',e=>{
 const b=e.target.closest('[data-id]');if(!b||e.button!==0)return;
 const id=b.dataset.id,resizeHandle=e.target.classList.contains('handle');
 if(resizeHandle){
  selected=id;group=new Set([id]);
  const f=frames.find(x=>x.id===id);if(!f?.rect)return;
  drag={startX:e.clientX,startY:e.clientY,resize:true,resizeFrame:clone(f),members:[],original:snapshot(),moved:false};
  render();$('#stage').setPointerCapture(e.pointerId);e.preventDefault();return;
 }
 if(e.ctrlKey||e.metaKey||e.shiftKey){
  if(group.has(id)&&group.size>1)group.delete(id);else group.add(id);
  selected=group.has(id)?id:[...group][0];
  render();e.preventDefault();return;
 }
 if(!group.has(id))group=new Set([id]);
 selected=id;
 const members=[...group].map(gid=>frames.find(x=>x.id===gid)).filter(f=>f?.rect&&!f.warning);
 if(!members.length){render();return;}
 const bbox=groupBBox(members);
 drag={startX:e.clientX,startY:e.clientY,resize:false,resizeFrame:null,members:members.map(m=>({id:m.id,frame:clone(m)})),bbox,original:snapshot(),moved:false};
 render();$('#stage').setPointerCapture(e.pointerId);e.preventDefault();
});
$('#stage').addEventListener('pointerdown',e=>{
 if(e.button!==0||e.target.closest('[data-id]'))return;
 marquee={startX:e.clientX,startY:e.clientY,additive:e.ctrlKey||e.metaKey||e.shiftKey,moved:false};
 $('#stage').setPointerCapture(e.pointerId);e.preventDefault();
});
const SNAP_RADIUS=8;
function frameSnap(f,left,top,others){
 const w=f.w,h=f.h,edgesX=[['left',left],['centerX',left+w/2],['right',left+w]],edgesY=[['top',top],['centerY',top+h/2],['bottom',top+h]];
 let bestX=null,bestY=null;
 for(const o of others){
  const ox=[o.rect.left,o.rect.left+o.rect.w/2,o.rect.left+o.rect.w],oy=[o.rect.top,o.rect.top+o.rect.h/2,o.rect.top+o.rect.h];
  for(const [edge,v] of edgesX)for(const ov of ox){const d=Math.abs(v-ov);if(d<=SNAP_RADIUS&&(!bestX||d<bestX.d))bestX={d,pos:ov,edge};}
  for(const [edge,v] of edgesY)for(const ov of oy){const d=Math.abs(v-ov);if(d<=SNAP_RADIUS&&(!bestY||d<bestY.d))bestY={d,pos:ov,edge};}
 }
 return {
  left:bestX?bestX.edge==='left'?bestX.pos:bestX.edge==='right'?bestX.pos-w:bestX.pos-w/2:null,
  top:bestY?bestY.edge==='top'?bestY.pos:bestY.edge==='bottom'?bestY.pos-h:bestY.pos-h/2:null,
  guideX:bestX?.pos??null,guideY:bestY?.pos??null,
 };
}
function renderGuides(guideX,guideY,v){
 if(guideX==null&&guideY==null){$('#guides').innerHTML='';return;}
 let html='';
 if(guideX!=null)html+=`<div class="guide v" style="left:${guideX/v.w*100}%"></div>`;
 if(guideY!=null)html+=`<div class="guide h" style="top:${guideY/v.h*100}%"></div>`;
 $('#guides').innerHTML=html;
}
$('#stage').addEventListener('pointermove',e=>{
 if(marquee){
  const rect=$('#stage').getBoundingClientRect();
  const x1=Math.min(marquee.startX,e.clientX),x2=Math.max(marquee.startX,e.clientX),y1=Math.min(marquee.startY,e.clientY),y2=Math.max(marquee.startY,e.clientY);
  if(!marquee.moved&&(x2-x1)+(y2-y1)<3)return;
  marquee.moved=true;marquee.rect={left:x1,top:y1,right:x2,bottom:y2};
  $('#marquee').style.cssText=`display:block;left:${x1-rect.left}px;top:${y1-rect.top}px;width:${x2-x1}px;height:${y2-y1}px;`;
  return;
 }
 if(!drag)return;
 const rect=$('#stage').getBoundingClientRect(),v=viewport(),dx=(e.clientX-drag.startX)/rect.width*v.w,dy=(e.clientY-drag.startY)/rect.height*v.h;
 if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<3)return;if(!drag.moved){pushHistory();drag.moved=true;}
 const snap=n=>$('#snap').checked?Math.round(n/4)*4:Math.round(n);
 try{
  if(drag.resize){
   const f=drag.resizeFrame;
   resizeFrame(profile,f,Math.max(10,Math.min(2000,snap(f.w+dx))),Math.max(10,Math.min(2000,snap(f.h+dy))));
   renderGuides(null,null,v);
  }else if(drag.members.length===1){
   const f=drag.members[0].frame;
   let left=f.rect.left+dx,top=f.rect.top+dy,guideX=null,guideY=null;
   if($('#snap').checked){
    const s=frameSnap(f,left,top,frames.filter(x=>x.id!==f.id&&x.rect));
    if(s.left!==null){left=s.left;guideX=s.guideX;}else left=snap(left);
    if(s.top!==null){top=s.top;guideY=s.guideY;}else top=snap(top);
   }
   moveFrame(profile,f,left,top,v);renderGuides(guideX,guideY,v);
  }else{
   const bbox=drag.bbox,memberIds=new Set(drag.members.map(m=>m.id));
   let left=bbox.left+dx,top=bbox.top+dy,guideX=null,guideY=null;
   if($('#snap').checked){
    const others=frames.filter(x=>!memberIds.has(x.id)&&x.rect);
    const s=frameSnap({w:bbox.w,h:bbox.h},left,top,others);
    if(s.left!==null){left=s.left;guideX=s.guideX;}else{const c=left+bbox.w/2;left=Math.round(c/4)*4-bbox.w/2;}
    if(s.top!==null){top=s.top;guideY=s.guideY;}else{const c=top+bbox.h/2;top=Math.round(c/4)*4-bbox.h/2;}
   }
   const fdx=left-bbox.left,fdy=top-bbox.top;
   for(const {frame:mf} of drag.members)moveFrame(profile,mf,mf.rect.left+fdx,mf.rect.top+fdy,v);
   renderGuides(guideX,guideY,v);
  }
  render();
 }catch(err){status(err.message);}
});
function focusFrame(){document.querySelector(`#frames [data-id="${CSS.escape(selected)}"]`)?.focus({preventScroll:true});}
function finishDrag(cancel=false){
 if(!drag)return;const d=drag;drag=null;$('#guides').innerHTML='';
 if(cancel&&d.moved){history.pop();restore(d.original);status('Drag canceled');}
 else{
  render();
  const label=d.resize?d.resizeFrame.label:d.members.length>1?`${d.members.length} frames`:d.members[0].frame.label;
  status(d.moved?`${label} ${d.resize?'resized':'moved'}`:`${label} selected`);
 }
 focusFrame();
}
function finishMarquee(){
 if(!marquee)return;const m=marquee;marquee=null;$('#marquee').style.display='none';
 if(!m.moved)return;
 const hits=frames.filter(f=>{
  if(!f.rect)return false;
  const el=document.querySelector(`#frames [data-id="${CSS.escape(f.id)}"]`);
  if(!el)return false;
  const r=el.getBoundingClientRect();
  return r.left<m.rect.right&&r.right>m.rect.left&&r.top<m.rect.bottom&&r.bottom>m.rect.top;
 });
 if(!hits.length)return;
 if(m.additive){for(const f of hits)group.add(f.id);selected=hits[hits.length-1].id;}
 else{group=new Set(hits.map(f=>f.id));selected=hits[0].id;}
 render();status(hits.length>1?`${hits.length} frames selected`:`${hits[0].label} selected`);
}
$('#stage').addEventListener('pointerup',()=>{finishDrag();finishMarquee();});
$('#stage').addEventListener('pointercancel',()=>{finishDrag(true);if(marquee){marquee=null;$('#marquee').style.display='none';}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&drag){finishDrag(true);return;}
 if(e.key==='Escape'&&marquee){marquee=null;$('#marquee').style.display='none';return;}
 if(e.key==='Escape'&&group.size>1){group=new Set([selected]);render();return;}
 if($('#dialog').open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
 if(e.target.closest('#frames')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();
  const members=draggableGroupFrames();if(!members.length)return;
  const n=e.shiftKey?10:1,ddx=e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0,ddy=e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0;
  mutate(()=>{for(const f of members)moveFrame(profile,f,f.rect.left+ddx,f.rect.top+ddy,viewport());},members.length>1?`${members.length} frames nudged`:`${members[0].label} nudged`);
  focusFrame();
 }
});
$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#grid').onchange=render;$('#snap').onchange=()=>status($('#snap').checked?'Dragging now snaps to nearby frame edges, falling back to a 4-unit grid for resizing':'Snapping disabled; imported coordinates are unchanged');$('#show-unsupported').onchange=()=>{render();status($('#show-unsupported').checked?'Custom anchors shown as editable markers':'Custom anchors hidden; their profile data is still preserved');};$('#resolution').onchange=()=>{render();status('Preview viewport updated; profile settings are unchanged');};
$('#canvas-zoom').onchange=()=>{const wrap=$('.stage-wrap');render();wrap.scrollTo({left:(wrap.scrollWidth-wrap.clientWidth)/2,top:(wrap.scrollHeight-wrap.clientHeight)/2,behavior:'smooth'});status(`Canvas zoom set to ${$('#canvas-zoom').value}%; profile settings are unchanged`);};
$('#ui-scale').onchange=()=>{if(!$('#ui-scale').checkValidity()||!Number($('#ui-scale').value))$('#ui-scale').value='0.71';render();status('Preview scale updated; match this to your in-game UI scale');};
$('#profile-name').onchange=()=>{const next=$('#profile-name').value.trim();if(!next||/[\x00-\x1f:]/.test(next)){status('Profile names cannot be empty or contain colons.');$('#profile-name').value=name;return;}mutate(()=>name=next,'Profile renamed');};
function dialog(html){$('#dialog-body').innerHTML=html;if(!$('#dialog').open)$('#dialog').showModal();}
function showHelp(){dialog(`<h2>Your UI, outside the game</h2><p>Import → arrange → export. All profile processing happens in your browser. Imported files are not uploaded.</p><p class="notice">WoW: Forever is the intended target. This editor currently uses Retail ElvUI settings. Forever support and in-game round-trip compatibility have not yet been verified.</p><p>Supported inputs: current <code>!E2!</code> and legacy <code>!E1!</code> character profile strings, ElvUI Lua table profile exports, and account <code>SavedVariables/ElvUI.lua</code> files.</p><p>Find your backup under your WoW installation → <code>WTF/Account/&lt;account&gt;/SavedVariables/ElvUI.lua</code>. The game-version folder depends on your installation. Keep the original backup.</p><p>The canvas is approximate. Absent mover positions use this editor’s estimates, not an exact reproduction of ElvUI defaults. Custom and plugin movers are editable anchor markers when their frame dimensions are unknown. Plugins, fonts, textures, private/global settings, and combat behavior are not simulated.</p><p>Viewport and UI scale affect the preview only. Editing a frame by dragging anchors it to the center of UIParent. Unresolved relative anchors are preserved and not moved.</p><p>Ctrl/Cmd-click or Shift-click a frame to add it to a selection, or drag an empty area of the canvas to draw a selection box. Dragging any selected frame moves the whole group together; group snapping aligns the group's overall bounding box, not each frame individually.</p><p><a href="https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/General/Distributor.lua" target="_blank" rel="noopener">ElvUI import/export source</a> · <a href="https://github.com/tukui-org/ElvUI/wiki/export" target="_blank" rel="noopener">ElvUI profile guide</a></p>`);}
$('#help').onclick=showHelp;
$('#import').onclick=()=>{
 dialog(`<h2>Bring in your UI</h2><p>Paste an ElvUI profile or choose your saved <code>ElvUI.lua</code> file. Your file stays in this browser.</p><label for="import-text">Profile string or Lua data</label><textarea id="import-text" spellcheck="false" placeholder="!E1!… or !E2!… or { … }::profile::My profile"></textarea><label class="import-file">Or choose a saved settings file (up to 4 MB)<input id="import-file" type="file" accept=".lua,.txt"></label><p id="import-error" class="error" role="alert"></p><div id="profile-choice"></div><div class="actions"><button id="read-profile" class="primary">Read profile</button></div>`);
 $('#import-file').onchange=async()=>{const f=$('#import-file').files[0];if(!f)return;if(f.size>LIMIT){$('#import-error').textContent='File exceeds the 4 MB limit.';return;}$('#import-text').value=await f.text();$('#profile-choice').innerHTML='';};
 $('#read-profile').onclick=()=>{try{const result=parseInput($('#import-text').value);$('#import-error').textContent='';const legacy=result.profiles.length===1&&result.profiles[0].format==='E1';$('#profile-choice').innerHTML=`<label class="field">Choose a profile<select id="choose-profile">${result.profiles.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select></label><p class="muted">Loading replaces the working profile. You can undo it.</p><div class="actions"><button id="load-profile" class="primary">Load selected profile</button>${legacy?'<button id="upgrade-profile">Upgrade to !E2!</button>':''}</div>`;$('#load-profile').onclick=()=>{const p=result.profiles[Number($('#choose-profile').value)];mutate(()=>{profile=clone(p.profile);name=p.name;source=`Imported ${p.format}`;selected='player';group=new Set(['player']);},`Loaded ${p.name}; original file unchanged`);$('#profile-name').value=name;$('#dialog').close();};if(legacy)$('#upgrade-profile').onclick=()=>showUpgrade(result.profiles[0]);}catch(e){$('#profile-choice').innerHTML='';$('#import-error').textContent=e.message;}};
};
function download(text,filename){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showUpgrade(p){try{const upgraded=exportProfile(p.profile,p.name,'e2');dialog(`<h2>Classic profile upgraded</h2><p>The <strong>${esc(p.name)}</strong> profile is ready as a current <code>!E2!</code> string. Your working layout and original profile were not changed.</p><p class="notice">In-game import and WoW: Forever compatibility remain unverified. Keep the original profile as a backup.</p><label for="upgraded-text">Upgraded profile</label><textarea id="upgraded-text" readonly spellcheck="false"></textarea><p id="upgrade-error" class="error" role="alert"></p><div class="actions"><button id="download-upgrade">Download .txt</button><button id="copy-upgrade" class="primary">Copy profile</button></div>`);$('#upgraded-text').value=upgraded;$('#download-upgrade').onclick=()=>download(upgraded,p.name.replace(/[^a-z0-9_-]/gi,'_')+'-upgraded-E2.txt');$('#copy-upgrade').onclick=async()=>{try{await navigator.clipboard.writeText(upgraded);$('#copy-upgrade').textContent='Copied';}catch{$('#upgraded-text').select();$('#upgrade-error').textContent='Clipboard access is unavailable. Select and copy the text manually.';}};}catch(e){$('#import-error').textContent=e.message;}}
$('#export').onclick=()=>{
 if(!applyProperties())return;
 if($('#profile-name').value.trim()!==name)$('#profile-name').onchange();
 dialog(`<h2>Ready for your next login</h2><p>Copy or download your edited profile. In ElvUI, open <strong>Profiles → Import Profile</strong>, paste the complete text, and import it under a new name.</p><p class="notice">Not yet tested in a live WoW client. Keep your original profile and verify the imported layout before replacing it. Forever compatibility remains unverified.</p><label class="field">Export format<select id="export-format"><option value="lua">ElvUI Lua table profile</option><option value="e2">Current !E2! profile string (experimental)</option></select></label><label for="export-text">Complete profile export</label><textarea id="export-text" readonly spellcheck="false"></textarea><p id="export-error" class="error" role="alert"></p><div class="actions"><button id="download">Download .txt</button><button id="copy" class="primary">Copy profile</button></div>`);
 const update=()=>{try{$('#export-text').value=exportProfile(profile,name,$('#export-format').value);$('#export-error').textContent='';$('#copy').disabled=$('#download').disabled=false;}catch(e){$('#export-error').textContent=e.message;$('#export-text').value='';$('#copy').disabled=$('#download').disabled=true;}};update();$('#export-format').onchange=update;
 $('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#export-text').value);$('#copy').textContent='Copied';status('Profile copied');}catch{$('#export-text').select();$('#export-error').textContent='Clipboard access is unavailable. Select and copy the text manually.';}};
 $('#download').onclick=()=>{download($('#export-text').value,name.replace(/[^a-z0-9_-]/gi,'_')+'-ElvUI.txt');status('Export downloaded');};
};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
render();
const context=document.modelContext;
if(context?.registerTool){
 const register=tool=>{try{Promise.resolve(context.registerTool(tool)).catch(()=>{});}catch{}};
 register({name:'read_elvui_layout',description:'Read the current profile name, compatibility status, and frame geometry.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({name,target:'Forever unverified; Retail baseline',frames:frames.map(f=>({id:f.id,label:f.label,rect:f.rect,warning:f.warning}))})});
 register({name:'move_elvui_frame',description:'Move a supported frame to a top-left coordinate in UI units, updating the visible layout and export data.',inputSchema:{type:'object',properties:{id:{type:'string'},left:{type:'number'},top:{type:'number'}},required:['id','left','top'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:input=>{if(!input||typeof input.id!=='string'||!Number.isFinite(input.left)||!Number.isFinite(input.top)||Math.abs(input.left)>20000||Math.abs(input.top)>20000)throw Error('Invalid frame position.');const f=frames.find(f=>f.id===input.id);if(!f||!f.rect||f.warning)throw Error('Frame cannot be positioned.');mutate(()=>moveFrame(profile,f,input.left,input.top,viewport()));return {id:f.id,rect:frames.find(x=>x.id===f.id).rect};}});
}
