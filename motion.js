/* 画面演出専用。文章・認定書の描画データには触れない。 */
(function(root){
'use strict';
const $=id=>document.getElementById(id),media=window.matchMedia('(prefers-reduced-motion: reduce)');
const active=new Set();let cycle=0,started=0,wait=0,frame=0,observer,awaiting=false;
function play(el,frames,options,done){
 if(media.matches||!el?.animate){done?.();return null;}
 const animation=el.animate(frames,options);active.add(animation);
 const finish=()=>{active.delete(animation);done?.();};
 animation.onfinish=finish;animation.oncancel=()=>active.delete(animation);return animation;
}
function stop(){awaiting=false;cycle++;clearTimeout(wait);cancelAnimationFrame(frame);for(const a of active)a.cancel();active.clear();$('review-effect').hidden=true;}
function intro(){
 if(media.matches)return;
 document.querySelectorAll('.hero-line > span').forEach((el,i)=>play(el,[{transform:'translateY(110%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:720,delay:100+i*160,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
 play($('hero-brush'),[{transform:'scaleX(0) rotate(-8deg)'},{transform:'scaleX(1) rotate(-8deg)'}],{duration:620,delay:300,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
 const headings=document.querySelectorAll('.section-title');
 if('IntersectionObserver' in root){observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){revealHeading(entry.target);observer.unobserve(entry.target);}}, {threshold:0.25});headings.forEach(el=>observer.observe(el));}
 else headings.forEach(revealHeading);
}
function revealHeading(el){
 const line=el.querySelector('.section-reveal-line');
 play(line,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
}
function chip(el){play(el,[{transform:'translateY(-10px) scale(.86)',opacity:0},{transform:'translateY(2px) scale(1.045)',opacity:1,offset:.65},{transform:'translateY(0) scale(1)',opacity:1}],{duration:440,easing:'ease-out'});}
function begin(){
 stop();awaiting=true;started=performance.now();if(media.matches)return;
 $('review-effect').hidden=false;
 play($('review-brush'),[{transform:'translateX(-115%) skewX(-12deg)'},{transform:'translateX(0) skewX(-12deg)',offset:.38},{transform:'translateX(0) skewX(-12deg)',offset:.72},{transform:'translateX(115%) skewX(-12deg)'}],{duration:620,easing:'cubic-bezier(.4,0,.2,1)'},()=>{$('review-effect').hidden=true;});
}
function present(preview){
 if(!awaiting)return;const token=cycle;
 function arrive(){if(token!==cycle)return;awaiting=false;preview.focus({preventScroll:true});play(preview,[{transform:'translateY(32px) rotate(-1.2deg) scale(.97)',opacity:.2},{transform:'translateY(0) rotate(0) scale(1)',opacity:1}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});}
 function move(){
  if(token!==cycle)return;
  if(media.matches){awaiting=false;preview.focus({preventScroll:true});preview.scrollIntoView({block:'start',behavior:'auto'});return;}
  // 移動を300msに固定し、長いフォームでも演出が長引かないようにする。
  const from=window.scrollY,to=Math.max(0,Math.min(from+preview.getBoundingClientRect().top-24,document.documentElement.scrollHeight-window.innerHeight)),start=performance.now();
  const step=now=>{if(token!==cycle)return;const t=Math.min(1,(now-start)/300);window.scrollTo(0,from+(to-from)*(1-Math.pow(1-t,3)));if(t<1)frame=requestAnimationFrame(step);else arrive();};frame=requestAnimationFrame(step);
 }
 clearTimeout(wait);if(media.matches)move();else wait=setTimeout(move,Math.max(0,450-(performance.now()-started)));
}
// 演出中でも手動操作を優先する。待機と自動移動のみ止め、入力を妨げない。
for(const type of ['touchstart','wheel','keydown'])window.addEventListener(type,stop,{passive:true});
media.addEventListener?.('change',()=>{stop();if(media.matches)observer?.disconnect();});
document.querySelectorAll('input:not([type=checkbox]):not([type=file]),select,textarea').forEach(el=>el.addEventListener('focus',()=>play(el,[{backgroundSize:'0% 3px',backgroundPosition:'50% 100%'},{backgroundSize:'100% 3px',backgroundPosition:'50% 100%'}],{duration:500,easing:'cubic-bezier(.16,1,.3,1)'})));
root.IiwakeMotion={begin,present,chip,stop};intro();
})(globalThis);
