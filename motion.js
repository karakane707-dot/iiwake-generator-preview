/* 画面演出専用。文章・認定書の描画データには触れない。 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),media=window.matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set();let cycle=0,started=0,wait=0,frame=0,observer,awaiting=false,previewReady=null,locked=false,savedY=0,returnFocus=null,background=[],value=0,finishing=false;
function lock(){savedY=window.scrollY;returnFocus=document.activeElement;document.activeElement?.blur?.();background=Array.from(document.querySelectorAll('body > header, body > main')).map(el=>({el,inert:el.inert}));background.forEach(({el})=>el.inert=true);document.body.style.top=-savedY+'px';document.body.classList.add('reviewing');locked=true;$('review-effect').focus({preventScroll:true});}
function unlock(){if(!locked)return;document.body.classList.remove('reviewing');document.body.style.top='';background.forEach(({el,inert})=>el.inert=inert);locked=false;window.scrollTo(0,savedY);}
function play(el,frames,options,done){
 if(media.matches||!el?.animate){done?.();return null;}
 const animation=el.animate(frames,options);active.add(animation);
 const finish=()=>{active.delete(animation);done?.();};
 animation.onfinish=finish;animation.oncancel=()=>active.delete(animation);return animation;
}
function stop(){const wasLocked=locked;awaiting=false;finishing=false;previewReady=null;cycle++;clearTimeout(wait);cancelAnimationFrame(frame);for(const a of active)a.cancel();active.clear();unlock();$('review-effect').hidden=true;if(wasLocked)returnFocus?.focus?.({preventScroll:true});}
function intro(){
 if(media.matches)return;
 document.querySelectorAll('.hero-line > span').forEach((el,i)=>play(el,[{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1100,delay:100+i*220,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'}));
 play($('hero-brush'),[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:1100,delay:350,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
 const headings=document.querySelectorAll('.section-title');
 if('IntersectionObserver' in root){observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){revealHeading(entry.target);observer.unobserve(entry.target);}}, {threshold:0.25});headings.forEach(el=>observer.observe(el));}
 else headings.forEach(revealHeading);
}
function revealHeading(el){
 const line=el.querySelector('.section-reveal-line');
 play(line,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:550,easing:'cubic-bezier(.22,.61,.36,1)'});
}
function chip(el){play(el,[{transform:'translateY(6px) scale(.97)',opacity:0},{transform:'translateY(-1px) scale(1.01)',opacity:1,offset:.8},{transform:'translateY(0) scale(1)',opacity:1}],{duration:380,easing:'cubic-bezier(.22,.61,.36,1)'});}
function begin(){
 stop();awaiting=true;value=0;started=performance.now();
 $('review-effect').hidden=false;
 lock();progress(0);wait=setTimeout(tick,50);
}
function progress(value){
 $('review-percent').textContent=value+'%';$('review-progress').value=value;
 $('review-heading').textContent=value===100?'認定完了':'審査中';
 const detail=value===100?'認定書を発行しました':value<34?'購入内容を確認中':value<67?'購入理由を精査中':'認定書を作成中';
 if($('review-detail').textContent!==detail)$('review-detail').textContent=detail;
}
// 段階表示用の目安。実際の描画・PNG準備が終わるまで100%にしない。
function tick(){
 if(!awaiting||finishing)return;
 const elapsed=performance.now()-started;
 const target=Math.min(previewReady?100:95,Math.floor(elapsed/2700*100));
 value=media.matches&&previewReady?100:Math.max(value,Math.min(target,value+2));progress(value);
 if(previewReady&&value===100){
  finishing=true;const token=cycle;wait=setTimeout(()=>{if(token!==cycle)return;const preview=previewReady;awaiting=false;finishing=false;previewReady=null;unlock();showPreview(preview);},350);return;
 }
 wait=setTimeout(tick,50);
}
function present(preview){if(!awaiting||finishing)return;previewReady=preview;clearTimeout(wait);tick();}
function showPreview(preview){
 // 全画面を閉じる前に認定書へ移動し、途中のフォームを見せない。
 preview.scrollIntoView({block:'start',behavior:'auto'});preview.focus({preventScroll:true});$('review-effect').hidden=true;
 play(preview,[{opacity:.55},{opacity:1}],{duration:750,easing:'ease-out'});
}
for(const type of ['touchmove','wheel','keydown'])window.addEventListener(type,event=>{if(locked){event.preventDefault();return;}if(type!=='keydown')stop();},{passive:false});
media.addEventListener?.('change',()=>{if(media.matches){observer?.disconnect();for(const a of active)a.cancel();active.clear();cancelAnimationFrame(frame);}if(awaiting&&!finishing){clearTimeout(wait);tick();}});
document.querySelectorAll('input:not([type=checkbox]):not([type=file]),select,textarea').forEach(el=>el.addEventListener('focus',()=>play(el,[{backgroundSize:'0% 3px',backgroundPosition:'50% 100%'},{backgroundSize:'100% 3px',backgroundPosition:'50% 100%'}],{duration:500,easing:'cubic-bezier(.16,1,.3,1)'})));
root.IiwakeMotion={begin,present,chip,stop};intro();
})(globalThis);
