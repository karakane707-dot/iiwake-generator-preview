/* 写真構図。元画像と確定済み構図を保持し、編集は別の下書きで行う。 */
(function(root){
'use strict';
const W=860,H=1100;
function bounds(img,state){const zoom=Math.min(4,Math.max(1,Number(state.zoom)||1)),scale=Math.max(W/img.width,H/img.height)*zoom,sw=W/scale,sh=H/scale;return {zoom,cx:Math.max(sw/2,Math.min(img.width-sw/2,state.cx)),cy:Math.max(sh/2,Math.min(img.height-sh/2,state.cy)),sw,sh};}
if(typeof module!=='undefined'&&module.exports){module.exports={bounds,W,H};return;}
const $=id=>document.getElementById(id),dialog=$('crop-dialog'),canvas=$('crop-canvas');
let committed=null,draft=null,drag=null,revision=0,returnFocus=null,locked=null;
const pointers=new Map();let pinch=null;
function fit(){
 if(!dialog.open)return;const v=root.visualViewport;
 dialog.style.setProperty('--crop-viewport',(v?.height||root.innerHeight)+'px');dialog.style.top=(v?.offsetTop||0)+'px';
 const r=$('crop-stage').getBoundingClientRect(),height=Math.max(1,Math.min(r.height,r.width*H/W));canvas.style.height=height+'px';canvas.style.width=(height*W/H)+'px';
}
function lock(){locked={css:document.body.style.cssText,x:root.scrollX,y:root.scrollY};Object.assign(document.body.style,{position:'fixed',top:-locked.y+'px',left:-locked.x+'px',width:'100%',overflow:'hidden'});}
function unlock(){if(!locked)return;const old=locked;locked=null;document.body.style.cssText=old.css;const style=document.documentElement.style,behavior=style.scrollBehavior;style.scrollBehavior='auto';root.scrollTo(old.x,old.y);returnFocus?.focus({preventScroll:true});style.scrollBehavior=behavior;}
root.addEventListener('resize',fit);root.visualViewport?.addEventListener('resize',fit);root.visualViewport?.addEventListener('scroll',fit);
if(root.ResizeObserver)new root.ResizeObserver(fit).observe($('crop-stage'));
function draw(){if(!draft)return;draft.state=bounds(draft.img,draft.state);const s=draft.state;canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
 ctx.drawImage(draft.img,s.cx-s.sw/2,s.cy-s.sh/2,s.sw,s.sh,0,0,W,H);$('crop-zoom').value=s.zoom;$('crop-zoom-value').textContent=s.zoom.toFixed(2)+'倍';}
function open(img,url){
 if(draft)cancel();returnFocus=document.activeElement;
 draft=img?{img,url,state:{zoom:1,cx:img.width/2,cy:img.height/2}}:{...committed,state:{...committed.state}};
 if(!draft.img)return;revision++;$('crop-message').textContent='';$('crop-confirm').disabled=false;draw();lock();try{dialog.showModal();fit();}catch(e){unlock();throw e;}
}
function close(){dialog.close();drag=null;pointers.clear();pinch=null;unlock();}
function cancel(){revision++;if(draft&&draft.url!==committed?.url)URL.revokeObjectURL(draft.url);draft=null;close();}
function clear(){if(draft)cancel();if(committed)URL.revokeObjectURL(committed.url);committed=null;$('recrop-photo').hidden=true;}
$('crop-cancel').addEventListener('click',cancel);$('crop-close').addEventListener('click',cancel);
dialog.addEventListener('cancel',event=>{event.preventDefault();cancel();});
$('recrop-photo').addEventListener('click',()=>{if(committed)open();});
$('crop-zoom').addEventListener('input',()=>{if(!draft)return;draft.state.zoom=Number($('crop-zoom').value);draw();});
function beginPinch(){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y)||1,zoom:draft.state.zoom};drag=null;}
canvas.addEventListener('pointerdown',event=>{if(!draft||pointers.size>=2)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(pointers.size===2)beginPinch();else drag={id:event.pointerId,x:event.clientX,y:event.clientY};});
canvas.addEventListener('pointermove',event=>{
 if(!draft||!pointers.has(event.pointerId))return;event.preventDefault();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(pointers.size===2){const [a,b]=[...pointers.values()];draft.state.zoom=pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance;draw();return;}
 if(drag?.id!==event.pointerId)return;const rect=canvas.getBoundingClientRect(),s=draft.state;draft.state.cx-=(event.clientX-drag.x)*s.sw/rect.width;draft.state.cy-=(event.clientY-drag.y)*s.sh/rect.height;drag.x=event.clientX;drag.y=event.clientY;draw();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(event.pointerId===undefined)pointers.clear();else pointers.delete(event.pointerId);pinch=null;const entry=[...pointers.entries()][0];drag=entry?{id:entry[0],...entry[1]}:null;});
canvas.addEventListener('keydown',event=>{if(!draft)return;const vectors={ArrowLeft:[1,0],ArrowRight:[-1,0],ArrowUp:[0,1],ArrowDown:[0,-1]},v=vectors[event.key];if(!v)return;event.preventDefault();draft.state.cx+=v[0]*draft.state.sw*.02;draft.state.cy+=v[1]*draft.state.sh*.02;draw();});
$('crop-confirm').addEventListener('click',()=>{
 if(!draft||$('crop-confirm').disabled)return;const token=++revision,snapshot={...draft,state:{...draft.state}};$('crop-confirm').disabled=true;
 // 保存専用canvas。変換中のドラッグが確定画像を変えないようにする。
 const output=document.createElement('canvas');output.width=W;output.height=H;const s=snapshot.state;output.getContext('2d').drawImage(snapshot.img,s.cx-s.sw/2,s.cy-s.sh/2,s.sw,s.sh,0,0,W,H);
 output.toBlob(blob=>{if(token!==revision)return;$('crop-confirm').disabled=false;if(!blob){$('crop-message').textContent='画像を作成できませんでした。もう一度お試しください。';return;}
  const url=URL.createObjectURL(blob);if(committed&&committed.url!==snapshot.url)URL.revokeObjectURL(committed.url);committed=snapshot;draft=null;$('recrop-photo').hidden=false;close();root.IiwakeCrop.onCommit?.(url);
 },'image/png');
});
root.IiwakeCrop={open,clear};
})(globalThis);
