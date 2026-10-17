/* 画面演出専用。文章・認定書の描画データには触れない。 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),media=window.matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set();let cycle=0,started=0,wait=0,frame=0,observer,awaiting=false,skipped=false,previewReady=null,reviewAnimation=null;
function play(el,frames,options,done){
 if(media.matches||!el?.animate){done?.();return null;}
 const animation=el.animate(frames,options);active.add(animation);
 const finish=()=>{active.delete(animation);done?.();};
 animation.onfinish=finish;animation.oncancel=()=>active.delete(animation);return animation;
}
function stop(){awaiting=false;previewReady=null;cycle++;clearTimeout(wait);cancelAnimationFrame(frame);for(const a of active)a.cancel();active.clear();$('review-effect').hidden=true;}
function intro(){
 if(media.matches)return;
 document.querySelectorAll('.hero-line > span').forEach((el,i)=>play(el,[{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1100,delay:100+i*220,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'}));
 play($('hero-brush'),[{transform:'scaleX(0) rotate(-8deg)'},{transform:'scaleX(1) rotate(-8deg)'}],{duration:1100,delay:350,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
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
 stop();awaiting=true;skipped=false;started=performance.now();if(media.matches)return;
 $('review-effect').hidden=false;
 reviewAnimation=play($('review-brush'),[{transform:'translateX(-8%)',opacity:0},{transform:'translateX(0)',opacity:1,offset:1/6},{transform:'translateX(0)',opacity:1,offset:5/6},{transform:'translateX(4%)',opacity:0}],{duration:2700,easing:'ease-in-out'},()=>{$('review-effect').hidden=true;});
}
function present(preview){
 if(!awaiting)return;previewReady=preview;const token=cycle;
 function arrive(){if(token!==cycle)return;awaiting=false;previewReady=null;preview.focus({preventScroll:true});play(preview,[{transform:'translateY(16px) rotate(-.4deg) scale(.99)',opacity:.2},{transform:'translateY(0) rotate(0) scale(1)',opacity:1}],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)'});}
 function move(){
  if(token!==cycle)return;
  $('review-effect').hidden=true;
  if(media.matches){awaiting=false;previewReady=null;preview.focus({preventScroll:true});preview.scrollIntoView({block:'start',behavior:'auto'});return;}
  // 移動は550ms、認定書の登場は850ms。審査の読める時間とは分ける。
  const from=window.scrollY,to=Math.max(0,Math.min(from+preview.getBoundingClientRect().top-24,document.documentElement.scrollHeight-window.innerHeight)),start=performance.now();
  const step=now=>{if(token!==cycle)return;const t=Math.min(1,(now-start)/550),ease=t*t*(3-2*t);window.scrollTo(0,from+(to-from)*ease);if(t<1)frame=requestAnimationFrame(step);else arrive();};frame=requestAnimationFrame(step);
 }
 clearTimeout(wait);if(media.matches||skipped)move();else wait=setTimeout(move,Math.max(0,2700-(performance.now()-started)));
}
function skip(){if(!awaiting)return;skipped=true;reviewAnimation?.cancel();$('review-effect').hidden=true;clearTimeout(wait);if(previewReady)present(previewReady);}
$('review-brush').addEventListener('click',skip);
// 演出中でも手動操作を優先する。待機と自動移動のみ止め、入力を妨げない。
for(const type of ['touchstart','wheel','keydown'])window.addEventListener(type,event=>{if(event?.target?.closest?.('#review-effect'))return;if(event?.key==='Escape'&&awaiting){skip();return;}stop();},{passive:true});
media.addEventListener?.('change',()=>{if(media.matches){observer?.disconnect();const preview=previewReady,wasAwaiting=awaiting;stop();awaiting=wasAwaiting;skipped=true;if(preview)present(preview);}});
document.querySelectorAll('input:not([type=checkbox]):not([type=file]),select,textarea').forEach(el=>el.addEventListener('focus',()=>play(el,[{backgroundSize:'0% 3px',backgroundPosition:'50% 100%'},{backgroundSize:'100% 3px',backgroundPosition:'50% 100%'}],{duration:500,easing:'cubic-bezier(.16,1,.3,1)'})));
root.IiwakeMotion={begin,present,chip,stop,skip};intro();
})(globalThis);
