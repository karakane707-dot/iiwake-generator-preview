/* 認定書専用描画。プレビューとPNGを同一canvasから作る。外部依存なし。 */
(function(root){
'use strict';
const FONT='"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", Meiryo, sans-serif';
const templates=[{id:'drawing',label:'01：ドローイング・抽象'},{id:'classic',label:'02：クラシック（仮）'},{id:'official',label:'03：公的審査書類（仮）'},{id:'minimal',label:'04：ミニマル（仮）'},{id:'editorial',label:'05：雑誌エディトリアル（仮）'}];
function font(ctx,size,weight=400){ctx.font=`${weight} ${size}px ${FONT}`;}
function wrap(ctx,text,width){
 const lines=[];
 // 改行を保持し、英数字だけの長い名前も分割する。結合文字は可能なら一塊にする。
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ja',{granularity:'grapheme'}):null;
 for(const paragraph of String(text).split('\n')){
  let line='';const chars=segmenter?Array.from(segmenter.segment(paragraph),s=>s.segment):Array.from(paragraph);
  for(const char of chars){if(line&&ctx.measureText(line+char).width>width){const tail=Array.from(line);if(/[、。，．！？）］｝」』】]/u.test(char)&&tail.length>1){const last=tail.pop();lines.push(tail.join(''));line=last+char;}else if(/[（［｛「『【]$/u.test(line)&&tail.length>1){const last=tail.pop();lines.push(tail.join(''));line=last+char;}else {lines.push(line);line=char;}}else line+=char;}
  lines.push(line);
 }
 return lines;
}
function lines(ctx,text,x,y,width,size=24,lineHeight=38,weight=400){font(ctx,size,weight);const rows=wrap(ctx,text,width);rows.forEach((row,i)=>ctx.fillText(row,x,y+i*lineHeight));return y+rows.length*lineHeight;}
function rule(ctx,x,y,width,color='#cbc9c2'){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke();}
function cross(ctx,x,y,size=13){ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);ctx.stroke();}
// 固定の不規則な輪郭と細いかすれで、参考の右上がりの筆跡を構成。
function brush(ctx,x,y,w,h){
 ctx.save();ctx.translate(x,y);ctx.scale(w/560,h/390);
 const grad=ctx.createLinearGradient(0,390,560,0);grad.addColorStop(0,'#101637');grad.addColorStop(.6,'#0a153f');grad.addColorStop(1,'#245da7');ctx.fillStyle=grad;
 const points=[[0,378],[9,349],[70,295],[116,270],[176,222],[255,177],[336,122],[408,55],[453,31],[518,0],[514,40],[523,58],[508,91],[515,110],[494,140],[484,183],[472,190],[465,162],[480,116],[453,132],[414,157],[365,196],[310,228],[247,266],[205,294],[158,318],[141,310],[112,337],[67,351],[24,383],[15,375]];
 ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();
 ctx.strokeStyle='#151f4a';ctx.lineWidth=3;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(30+i*4,369-i*2);ctx.lineTo(130+i*11,291-i*6);ctx.stroke();}
 ctx.fillStyle='#f8f7f2';for(const p of [[[51,342],[90,300],[124,289],[106,309]],[[462,139],[478,116],[471,148],[451,175]]]){ctx.beginPath();p.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();}ctx.restore();
}
function photo(ctx,img,x,y,w,h){
 // cover：中央から同じ比率の領域を切り出し、枠を隙間なく満たす。
 const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale;
 ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);
}
// 参考01：輪郭線を作らず、紙の繊維ににじむように透明度を変える。
function photoOpacity(u,v){
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const edge=.38-.24*smooth((v-.25)/.4)+.02*Math.sin(v*37);
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(x,y)=>{const a=Math.floor(x),b=Math.floor(y),fx=smooth(x-a),fy=smooth(y-b);return (hash(a,b)*(1-fx)+hash(a+1,b)*fx)*(1-fy)+(hash(a,b+1)*(1-fx)+hash(a+1,b+1)*fx)*fy;};
 const grain=(noise(u*65,v*90)-.5)*2+(noise(u*230,v*310)-.5)*.35;
 return smooth((u-edge+grain*.035)/.24)*smooth(v/.035)*smooth((1-v+grain*.012)/.16)*smooth((1-v)/.025);
}
function surface(ctx,w,h){const c=ctx.canvas.ownerDocument?ctx.canvas.ownerDocument.createElement('canvas'):new ctx.canvas.constructor(w,h);c.width=w;c.height=h;return c;}
let fadeMask;
function fullbleed(ctx,img){
 const w=860,h=1100,layer=surface(ctx,w,h),p=layer.getContext('2d');
 photo(p,img,0,0,w,h);
 if(!fadeMask){fadeMask=surface(ctx,w,h);const m=fadeMask.getContext('2d'),pixels=m.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;pixels.data[i+3]=Math.round(255*photoOpacity(x/(w-1),y/(h-1)));}m.putImageData(pixels,0,0);
 }
 p.globalCompositeOperation='destination-in';p.drawImage(fadeMask,0,0);ctx.drawImage(layer,300,0,600,600*1100/860);
}
// 細い筆毛を重ねて濃淡・かすれを作る。写真描画後だけに使用する。
function dryBrush(ctx,x,y,w,h){
 ctx.save();let seed=719;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<105;i++){const lane=(i/104-.5)*h*.25,start=rand()*.32,end=.65+rand()*.4,thick=1+rand()*9;
  ctx.fillStyle=i%9===0?'#24466d':'#0d2048';ctx.globalAlpha=.5+rand()*.5;
  const yy=t=>y+h*(1-t)+lane+Math.sin(t*5+i)*4;
  ctx.beginPath();ctx.moveTo(x+w*start,yy(start));ctx.lineTo(x+w*(start+.14),yy(start+.14)-thick*.5);ctx.lineTo(x+w*(end-.12),yy(end-.12)-thick);ctx.lineTo(x+w*end,yy(end));ctx.lineTo(x+w*(end-.18),yy(end-.18)+thick*.5);ctx.lineTo(x+w*(start+.07),yy(start+.07)+thick*.3);ctx.closePath();ctx.fill();
 }ctx.restore();
}
function layout(ctx,data){
 // 900×1600の論理座標を1.2倍して1080×1920pxに出力する。
 // 読める最小文字サイズで収まらなければ、内容を切らずに編集を依頼する。
 function fit(text,width,height,sizes,weight=400){
  for(const size of sizes){font(ctx,size,weight);const rows=wrap(ctx,text,width),lineHeight=Math.ceil(size*1.4);if(rows.length*lineHeight<=height)return {rows,size,lineHeight};}
  return null;
 }
 const product=fit(data.product,300,data.template==='drawing'?200:240,[28,26,24,22],800);
 if(!product){const e=Error('商品名が1枚に収まりません。商品名を短くして、再度生成してください。');e.code='LAYOUT_OVERFLOW';throw e;}
 const reasonY=790;
 font(ctx,24);const reasons=data.reasons.length?data.reasons:['理由の指定なし'];
 const reasonHeights=reasons.map(r=>Math.max(48,wrap(ctx,r,650).length*30+18));
 const bodyY=reasonY+32+reasonHeights.reduce((a,b)=>a+b,0)+64;
 const body=fit(data.text,772,1480-bodyY,[26,24,22]);
 if(!body){const e=Error('認定文章が1枚に収まりません。文章を短くするか、不要な改行を減らしてください。内容は保持しています。');e.code='LAYOUT_OVERFLOW';throw e;}
 return {reasonY,reasonHeights,reasons,bodyY,bodyRows:body.rows,bodySize:body.size,bodyLineHeight:body.lineHeight,product,height:1600};
}
function render(canvas,data,img=null){
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('このブラウザでは画像を作成できません。');
 const l=layout(ctx,data),width=900;
 const scale=1.2;
 canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.textBaseline='top';
 const style=templates.some(t=>t.id===data.template)?data.template:'drawing';
 ctx.fillStyle=style==='classic'?'#faf6eb':style==='minimal'?'#ffffff':'#f8f7f2';ctx.fillRect(0,0,width,l.height);
 if(style==='classic'){ctx.strokeStyle='#766849';ctx.lineWidth=3;ctx.strokeRect(24,24,852,l.height-48);ctx.lineWidth=1;ctx.strokeRect(33,33,834,l.height-66);}
 if(style==='official'){ctx.fillStyle='#e3e7e5';ctx.fillRect(50,135,800,240);}
 if(style==='editorial'){ctx.fillStyle='#152247';ctx.fillRect(0,0,20,l.height);ctx.fillStyle='#e5e4dd';ctx.fillRect(408,365,442,395);}
 if(style==='drawing'){
  if(img)fullbleed(ctx,img);
  dryBrush(ctx,440,-24,510,330);dryBrush(ctx,660,650,330,110);
 }
 ctx.fillStyle='#131313';lines(ctx,'PURCHASE\nJUSTIFICATION\nBUREAU',62,55,250,18,24,800);
 font(ctx,style==='drawing'?13:17,600);ctx.fillText('No. '+data.number,style==='drawing'?350:490,62);cross(ctx,822,69);
 ctx.fillStyle='#080808';lines(ctx,'購入正当化\n認定書。',60,155,750,76,86,900);
 font(ctx,20,700);ctx.fillText('CERTIFICATE OF JUSTIFICATION',64,340);
 if(img&&style!=='drawing')photo(ctx,img,405,385,430,365);
 else if(!img&&style!=='drawing'){ctx.strokeStyle='#b9b8af';ctx.lineWidth=1;ctx.strokeRect(420,395,400,345);cross(ctx,620,530,36);font(ctx,15,500);ctx.fillStyle='#555a62';ctx.fillText('THE VALUE IS IN YOUR REASONS.',450,640);}
 ctx.fillStyle='#111';font(ctx,17,700);ctx.fillText('ITEM / 購入品',64,390);
 font(ctx,l.product.size,800);l.product.rows.forEach((row,i)=>ctx.fillText(row,64,425+i*l.product.lineHeight));
 const priceY=style==='drawing'?640:683;
 rule(ctx,64,priceY,44);font(ctx,17,700);ctx.fillText('PRICE / 購入金額',64,priceY+15);
 let priceSize=40;const price='¥'+data.amount.toLocaleString('ja-JP');font(ctx,priceSize,800);while(ctx.measureText(price).width>310&&priceSize>20){font(ctx,--priceSize,800);}ctx.fillText(price,64,priceY+43);
 font(ctx,17,700);ctx.fillText('REASONS',64,l.reasonY);let ry=l.reasonY+32;
 l.reasons.forEach((r,i)=>{rule(ctx,64,ry,772);font(ctx,21,600);ctx.fillText(String(i+1).padStart(2,'0'),82,ry+10);lines(ctx,r,155,ry+9,650,24,30,500);ry+=l.reasonHeights[i];});rule(ctx,64,ry,772);
 ctx.fillStyle='#141414';font(ctx,17,700);ctx.fillText('JUSTIFICATION',64,l.bodyY-40);
 font(ctx,l.bodySize);l.bodyRows.forEach((row,i)=>ctx.fillText(row,64,l.bodyY+i*l.bodyLineHeight));
 const foot=1520;rule(ctx,64,foot-25,772);font(ctx,16,700);ctx.fillText('PURCHASE JUSTIFICATION BUREAU',64,foot);cross(ctx,816,foot+10,16);
 font(ctx,15);ctx.fillText('購入正当化審査室  /  架空の機関による、楽しむための認定書です。',64,foot+31);
 return {width:canvas.width,height:canvas.height,layout:l};
}
const api={templates,wrap,layout,render,photoOpacity};root.IiwakeCertificate=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
