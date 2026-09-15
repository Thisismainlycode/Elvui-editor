import {parseInput,exportProfile,LIMIT} from './profile.js';
import {newProfile,framesFor,moveFrame,resizeFrame,get,set,clone,ANCHORS} from './model.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile=newProfile(),name='My next adventure',selected='player',source='New layout',dirty=false,history=[],future=[],frames=[],drag=null,applyProperties=()=>true;
const viewport=()=>{const [w,h]=$('#resolution').value.split(',').map(Number),scale=Number($('#ui-scale').value);return {w:w/scale,h:h/scale};};
const status=message=>$('#status').textContent=message;
const snapshot=()=>({profile:clone(profile),name,selected,source,dirty});
function pushHistory(){history.push(snapshot());if(history.length>70)history.shift();future=[];dirty=true;}
function restore(s){({profile,name,selected,source,dirty}=s);$('#profile-name').value=name;render();}
function mutate(fn,msg='Layout updated'){const old=snapshot(),oldFuture=future;try{pushHistory();fn();render();status(msg);}catch(e){history.pop();future=oldFuture;restore(old);status(e.message);}}
function undo(){if(!history.length)return;future.push(snapshot());restore(history.pop());status('Change undone');}
function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());status('Change restored');}
function selectedFrame(){return frames.find(f=>f.id===selected);}
function render(){
 const view=viewport();frames=framesFor(profile,view);if(!selectedFrame())selected=frames[0].id;
 $('#count').textContent=`${frames.length} frames`;$('#profile-status').textContent=source+(dirty?' · Edited':'');$('#undo').disabled=!history.length;$('#redo').disabled=!future.length;
 $('#layers').innerHTML=frames.map(f=>`<button class="layer ${f.id===selected?'active':''}" data-id="${esc(f.id)}" aria-pressed="${f.id===selected}"><span>${esc(f.label)}</span><small>${f.warning?'!':f.enabled?'◇':'off'}</small></button>`).join('');
 $('#stage').style.aspectRatio=`${view.w}/${view.h}`;$('#stage').classList.toggle('no-grid',!$('#grid').checked);
 $('#frames').innerHTML=frames.filter(f=>f.rect).map(f=>{
 let body=`<span class="fill"></span><span class="frame-text">${esc(f.label)}</span><span class="frame-text">100%</span>`;
 let style=`left:${f.rect.left/view.w*100}%;top:${f.rect.top/view.h*100}%;width:${f.w/view.w*100}%;height:${f.h/view.h*100}%;opacity:${f.enabled?1:.32};`;
 if(f.kind==='bar'){const n=Math.max(1,Math.min(12,Number(get(profile,[...f.path,'buttons'],12))||12)),cols=Math.max(1,Math.min(12,Number(get(profile,[...f.path,'buttonsPerRow'],12))||12));body=Array.from({length:n},(_,i)=>`<span class="slot">${i<9?i+1:i===9?'0':i===10?'-':'='}</span>`).join('');style+=`grid-template-columns:repeat(${Math.min(cols,n)},1fr);grid-template-rows:repeat(${Math.ceil(n/cols)},1fr);`;}
 if(f.kind==='raid')body=Array.from({length:25},()=>'<span class="raid-cell"></span>').join('');
 if(['chat','minimap','unknown'].includes(f.kind))body=`<span class="frame-text">${esc(f.label)}</span>`;
 return `<button class="frame ${f.kind} ${f.resize&&f.kind!=='minimap'?'power':''} ${f.id===selected?'selected':''}" data-id="${esc(f.id)}" style="${style}" aria-label="${esc(f.label)}, drag or use arrow keys to move">${body}${f.id===selected&&f.resize?'<span class="handle" aria-hidden="true"></span>':''}</button>`;
 }).join('');renderProperties();
}
const field=(label,id,value,min=-99999,max=99999)=>`<label class="field">${label}<input id="${id}" type="number" min="${min}" max="${max}" step="1" value="${Number(value)}" required></label>`;
function renderProperties(){
 const f=selectedFrame(),m=f.moverData||{anchor:'CENTER',parent:'UIParent',relative:'CENTER',x:f.x,y:f.y};
 $('#frame-title').textContent=f.label;$('#frame-kind').textContent=f.kind==='unknown'?'CUSTOM MOVER':f.kind.toUpperCase();$('#frame-description').textContent=f.estimated?'Estimated position · no saved mover':f.kind==='raid'?'Approximate group footprint':'Position and dimensions';
 let html='';if(f.warning)html+=`<p class="readonly-note">${esc(f.warning)}</p>`;
 else html+=`<div class="property-group"><h2>POSITION · UI UNITS</h2><div class="field-row">${field('X offset','prop-x',m.x)}${field('Y offset','prop-y',m.y)}</div><label class="field">Frame anchor<select id="prop-anchor">${ANCHORS.map(a=>`<option ${a===m.anchor?'selected':''}>${a}</option>`).join('')}</select></label><p class="anchor-code">Relative to ${esc(m.parent)} · ${esc(m.relative)}<br>Positive Y moves upward.</p></div>`;
 if(f.resize)html+=`<div class="property-group"><h2>DIMENSIONS</h2><div class="field-row">${field(f.kind==='minimap'?'Size':'Width','prop-width',f.w,10,2000)}${f.kind==='minimap'?'':field('Height','prop-height',f.h,10,2000)}</div></div>`;
 if(f.kind==='bar')html+=`<div class="property-group"><h2>BUTTON LAYOUT</h2><div class="field-row">${field('Buttons','prop-buttons',get(profile,[...f.path,'buttons'],12),1,12)}${field('Per row','prop-cols',get(profile,[...f.path,'buttonsPerRow'],12),1,12)}${field('Size','prop-size',get(profile,[...f.path,'buttonSize'],34),16,100)}${field('Spacing','prop-gap',get(profile,[...f.path,'buttonSpacing'],2),0,30)}</div></div>`;
 if(f.kind==='chat')html+='<p class="muted">Chat panel size is previewed from your profile. This version edits its position only.</p>';
 if(f.kind==='raid'||f.kind==='unknown')html+='<p class="muted">The group or plugin footprint is a placeholder. Only its saved mover position is editable.</p>';
 if(f.enable)html+=`<div class="property-group"><label class="check" style="margin:0"><input id="prop-enable" type="checkbox" ${f.enabled?'checked':''}> Enable frame in ElvUI</label></div>`;
 html+=`<button id="apply-properties" style="margin-top:20px">Apply properties</button><div class="property-group"><h2>PROFILE SETTING</h2><code class="anchor-code">movers.${esc(f.mover)}</code></div>`;
 $('#properties').innerHTML=html;$('#selection-coords').textContent=f.rect?`${Math.round(f.w)} × ${Math.round(f.h)} UI units`:'Position unavailable';
 const inputs=[...$('#properties').querySelectorAll('input,select')];
 const value=input=>input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;
 const initial=new Map(inputs.map(input=>[input.id,value(input)]));
 applyProperties=()=>{
  if(inputs.some(input=>!input.checkValidity())){status('Enter a valid number within the displayed range.');inputs.find(input=>!input.checkValidity())?.reportValidity();return false;}
  const changed=inputs.filter(input=>value(input)!==initial.get(input.id));if(!changed.length)return true;
  const values=new Map(inputs.map(input=>[input.id,value(input)]));
  mutate(()=>{
   if(changed.some(input=>['prop-x','prop-y','prop-anchor'].includes(input.id)))set(profile,['movers',f.mover],`${values.get('prop-anchor')},${m.parent},${m.relative},${values.get('prop-x')},${values.get('prop-y')}`);
   if(changed.some(input=>['prop-width','prop-height'].includes(input.id)))resizeFrame(profile,f,values.get('prop-width'),values.get('prop-height')??f.h);
   for(const input of changed){const id=input.id;if(id==='prop-enable')set(profile,[...f.path,'enable'],values.get(id));const key={'prop-buttons':'buttons','prop-cols':'buttonsPerRow','prop-size':'buttonSize','prop-gap':'buttonSpacing'}[id];if(key)set(profile,[...f.path,key],values.get(id));}
  },`${f.label} updated`);return true;
 };
 $('#apply-properties').onclick=()=>applyProperties();
 for(const input of inputs)input.addEventListener('change',()=>applyProperties());
}
$('#layers').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b&&applyProperties()){selected=b.dataset.id;render();}});
$('#frames').addEventListener('pointerdown',e=>{
 const b=e.target.closest('[data-id]');if(!b||e.button!==0)return;selected=b.dataset.id;const f=frames.find(f=>f.id===selected);if(!f?.rect)return;
 drag={startX:e.clientX,startY:e.clientY,frame:clone(f),original:snapshot(),resize:e.target.classList.contains('handle'),moved:false};
 render();$('#stage').setPointerCapture(e.pointerId);e.preventDefault();
});
$('#stage').addEventListener('pointermove',e=>{
 if(!drag)return;const rect=$('#stage').getBoundingClientRect(),v=viewport(),dx=(e.clientX-drag.startX)/rect.width*v.w,dy=(e.clientY-drag.startY)/rect.height*v.h;
 if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<3)return;if(!drag.moved){pushHistory();drag.moved=true;}
 const snap=n=>$('#grid').checked?Math.round(n/4)*4:Math.round(n),f=drag.frame;
 try{if(drag.resize)resizeFrame(profile,f,Math.max(10,Math.min(2000,snap(f.w+dx))),Math.max(10,Math.min(2000,snap(f.h+dy))));else moveFrame(profile,f,snap(f.rect.left+dx),snap(f.rect.top+dy),v);render();}catch(err){status(err.message);}
});
function focusFrame(){document.querySelector(`#frames [data-id="${CSS.escape(selected)}"]`)?.focus({preventScroll:true});}
function finishDrag(cancel=false){if(!drag)return;const d=drag;drag=null;if(cancel&&d.moved){history.pop();restore(d.original);status('Drag canceled');}else{render();status(d.moved?`${d.frame.label} ${d.resize?'resized':'moved'}`:`${d.frame.label} selected`);}focusFrame();}
$('#stage').addEventListener('pointerup',()=>finishDrag());$('#stage').addEventListener('pointercancel',()=>finishDrag(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){finishDrag(true);return;}if($('#dialog').open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
 if(e.target.closest('#frames')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const f=selectedFrame();if(!f?.rect)return;const n=e.shiftKey?10:1;mutate(()=>moveFrame(profile,f,f.rect.left+(e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0),f.rect.top+(e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0),viewport()),`${f.label} nudged`);focusFrame();}});
$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#grid').onchange=render;$('#resolution').onchange=()=>{render();status('Preview viewport updated; profile settings are unchanged');};
$('#ui-scale').onchange=()=>{if(!$('#ui-scale').checkValidity()||!Number($('#ui-scale').value))$('#ui-scale').value='0.71';render();status('Preview scale updated; match this to your in-game UI scale');};
$('#profile-name').onchange=()=>{const next=$('#profile-name').value.trim();if(!next||/[\x00-\x1f:]/.test(next)){status('Profile names cannot be empty or contain colons.');$('#profile-name').value=name;return;}mutate(()=>name=next,'Profile renamed');};
function dialog(html){$('#dialog-body').innerHTML=html;if(!$('#dialog').open)$('#dialog').showModal();}
function showHelp(){dialog(`<h2>Your UI, outside the game</h2><p>Import → arrange → export. All profile processing happens in your browser. Imported files are not uploaded.</p><p class="notice">WoW: Forever is the intended target. This editor currently uses Retail ElvUI settings. Forever support and in-game round-trip compatibility have not yet been verified.</p><p>Supported inputs: current <code>!E2!</code> and legacy <code>!E1!</code> character profile strings, ElvUI Lua table profile exports, and account <code>SavedVariables/ElvUI.lua</code> files.</p><p>Find your backup under your WoW installation → <code>WTF/Account/&lt;account&gt;/SavedVariables/ElvUI.lua</code>. The game-version folder depends on your installation. Keep the original backup.</p><p>The canvas is approximate. Absent mover positions use this editor’s estimates, not an exact reproduction of ElvUI defaults. Raid groups and unknown movers use placeholder dimensions. Plugins, fonts, textures, private/global settings, and combat behavior are not simulated.</p><p>Viewport and UI scale affect the preview only. Editing a frame by dragging anchors it to the center of UIParent. Unresolved relative anchors are preserved and not moved.</p><p><a href="https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/General/Distributor.lua" target="_blank" rel="noopener">ElvUI import/export source</a> · <a href="https://github.com/tukui-org/ElvUI/wiki/export" target="_blank" rel="noopener">ElvUI profile guide</a></p>`);}
$('#help').onclick=showHelp;
$('#import').onclick=()=>{
 dialog(`<h2>Bring in your UI</h2><p>Paste an ElvUI profile or choose your saved <code>ElvUI.lua</code> file. Your file stays in this browser.</p><label for="import-text">Profile string or Lua data</label><textarea id="import-text" spellcheck="false" placeholder="!E1!… or !E2!… or { … }::profile::My profile"></textarea><label class="import-file">Or choose a saved settings file (up to 4 MB)<input id="import-file" type="file" accept=".lua,.txt"></label><p id="import-error" class="error" role="alert"></p><div id="profile-choice"></div><div class="actions"><button id="read-profile" class="primary">Read profile</button></div>`);
 $('#import-file').onchange=async()=>{const f=$('#import-file').files[0];if(!f)return;if(f.size>LIMIT){$('#import-error').textContent='File exceeds the 4 MB limit.';return;}$('#import-text').value=await f.text();$('#profile-choice').innerHTML='';};
 $('#read-profile').onclick=()=>{try{const result=parseInput($('#import-text').value);$('#import-error').textContent='';const legacy=result.profiles.length===1&&result.profiles[0].format==='E1';$('#profile-choice').innerHTML=`<label class="field">Choose a profile<select id="choose-profile">${result.profiles.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select></label><p class="muted">Loading replaces the working profile. You can undo it.</p><div class="actions"><button id="load-profile" class="primary">Load selected profile</button>${legacy?'<button id="upgrade-profile">Upgrade to !E2!</button>':''}</div>`;$('#load-profile').onclick=()=>{const p=result.profiles[Number($('#choose-profile').value)];mutate(()=>{profile=clone(p.profile);name=p.name;source=`Imported ${p.format}`;selected='player';},`Loaded ${p.name}; original file unchanged`);$('#profile-name').value=name;$('#dialog').close();};if(legacy)$('#upgrade-profile').onclick=()=>showUpgrade(result.profiles[0]);}catch(e){$('#profile-choice').innerHTML='';$('#import-error').textContent=e.message;}};
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
