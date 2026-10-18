/* 認定書専用描画。プレビューとPNGを同一canvasから作る。外部依存なし。 */
(function(root){
'use strict';
const FONT='"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", Meiryo, sans-serif';
const templates=[{id:'drawing',label:'01：ドローイング・抽象'},{id:'classic',label:'02：クラシック'},{id:'official',label:'03：エディトリアル'},{id:'minimal',label:'04：ミニマル'},{id:'editorial',label:'05：アートコラージュ'}];
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
// Aの太い筆圧を主形にする。長方形や平行線を重ねず、顔料の面を直接生成。
function inkNoise(x,y){
 const a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const hash=(i,j)=>{let n=Math.imul(i+71,374761393)^Math.imul(j+137,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 return (hash(a,b)*(1-sx)+hash(a+1,b)*sx)*(1-sy)+(hash(a,b+1)*(1-sx)+hash(a+1,b+1)*sx)*sy;
}
function brushOpacity(u,v){
 if(u<0||u>1||v<0||v>1)return 0;
 const clamp=t=>Math.max(0,Math.min(1,t)),center=.92-.82*u-.09*Math.sin(Math.PI*u),d=v-center;
 // 筆圧は中央〜右側で大きく、入りと抜けは非対称に細くなる。
 const pressure=.205*Math.pow(Math.sin(Math.PI*u),.85)*(.65+.48*u);
 const fringe=(inkNoise(u*47,d*36)-.5)*.064+(inkNoise(u*137,d*95)-.5)*.025;
 let main=clamp((pressure-Math.abs(d)+fringe)*260);
 // 毛束ごとに開始・終了位置が違う。面を残しながら裂け目だけを抜く。
 const tip=inkNoise(d*105,9),start=.015+tip*.16,end=.89+tip*.11;
 main*=clamp((u-start)*160)*clamp((end-u)*150);
 const split=inkNoise(u*12+inkNoise(d*18,2),d*220+Math.sin(u*9)*1.8);
 const edge=Math.abs(d)/(pressure+.006),grain=inkNoise(u*430,v*480);
 main*=1-clamp((split-(edge>.65?.61:.94))*12);
 if(grain>(edge>.65?.78:.96))main*=.15;
 // B・C：主筆から離れて再び合流する、少数の不揃いな補助筆。
 const side1=d+pressure*.95+.022*Math.sin(u*13),side2=d-pressure*.85-.02*Math.sin(u*8);
 const b=clamp((.012*Math.sin(Math.PI*u)-Math.abs(side1)+fringe*.2)*300)*(u>.1&&u<.86?1:0);
 const c=clamp((.006-Math.abs(side2)+fringe*.1)*400)*(u>.22&&u<.96?1:0);
 return Math.max(main,Math.max(b,c)*(split>.58?.05:.9));
}
// 左端専用の静的な顔料マップ。写真・文字の領域へは描かない。
let marginBrush;
function verticalBrush(ctx){
 if(!marginBrush){
  const w=144,h=1450; marginBrush=surface(ctx,w*2,h*2);
  const p=marginBrush.getContext('2d'),pixels=p.createImageData(w*2,h*2);
  const strokes=[{y:18,h:360,x:60,w:100,flip:1},{y:310,h:650,x:43,w:190,flip:-1},{y:940,h:470,x:51,w:150,flip:1}];
  for(let y=0;y<h*2;y++)for(let x=0;x<w*2;x++){
   const px=x/2,py=y/2;let alpha=0;
   for(const s of strokes){
    const t=(py-s.y)/s.h;if(t<0||t>1)continue;
    const u=s.flip>0?t:1-t,center=.92-.82*u-.09*Math.sin(Math.PI*u);
    const bend=Math.sin(t*5.8)*12+Math.sin(t*13)*3;
    alpha=Math.max(alpha,brushOpacity(u,center+(px-s.x-bend)/s.w));
   }
   const i=(y*w*2+x)*4,tone=inkNoise(px*.09,py*.025);
   pixels.data[i]=8+tone*5;pixels.data[i+1]=23+tone*9;pixels.data[i+2]=52+tone*14;pixels.data[i+3]=Math.round(alpha*255);
  }
  // 控えめな飛沫も同じ左余白内に限定する。
  let seed=431;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  for(let n=0;n<95;n++){
   const cx=8+rand()*121,cy=30+rand()*1370,r=n%23===0?4: .6+rand()*1.7;
   for(let y=Math.max(0,Math.floor((cy-r)*2));y<Math.min(h*2,(cy+r)*2);y++)for(let x=Math.max(0,Math.floor((cx-r)*2));x<Math.min(w*2,(cx+r)*2);x++){
    const a=Math.max(0,Math.min(1,(r-Math.hypot(x/2-cx,(y/2-cy)*1.2))*2)),i=(y*w*2+x)*4;
    if(a*255>pixels.data[i+3]){pixels.data[i]=10;pixels.data[i+1]=27;pixels.data[i+2]=58;pixels.data[i+3]=a*255;}
   }
  }
  p.putImageData(pixels,0,0);
 }
 ctx.drawImage(marginBrush,0,22,144,1450);
}
function extras(){return root.IiwakeExtraTemplates||(typeof module!=='undefined'?require('./certificate-templates.js'):null);}
function layout(ctx,data){
 if(data.template&&data.template!=='drawing'&&extras()?.renderers[data.template])return extras().layout(ctx,data,wrap);
 // 900×1600の論理座標を1.2倍して1080×1920pxに出力する。
 // 読める最小文字サイズで収まらなければ、内容を切らずに編集を依頼する。
 function fit(text,width,height,sizes,weight=400){
  for(const size of sizes){font(ctx,size,weight);const rows=wrap(ctx,text,width),lineHeight=Math.ceil(size*1.4);if(rows.length*lineHeight<=height)return {rows,size,lineHeight};}
  return null;
 }
 const product=fit(data.product,300,data.template==='drawing'?200:240,[28,26,24,22],800);
 if(!product){const e=Error('商品名が1枚に収まりません。商品名を短くして、再度生成してください。');e.code='LAYOUT_OVERFLOW';throw e;}
 const reasonY=790, left=data.template==='drawing'?156:64, contentWidth=836-left, reasonWidth=contentWidth-91;
 font(ctx,24);const reasons=data.reasons.length?data.reasons:['理由の指定なし'];
 const reasonHeights=reasons.map(r=>Math.max(48,wrap(ctx,r,reasonWidth).length*30+18));
 const bodyY=reasonY+32+reasonHeights.reduce((a,b)=>a+b,0)+64;
 const body=fit(data.text,contentWidth,1480-bodyY,[26,24,22]);
 if(!body){const e=Error('認定文章が1枚に収まりません。文章を短くするか、不要な改行を減らしてください。内容は保持しています。');e.code='LAYOUT_OVERFLOW';throw e;}
 return {left,contentWidth,reasonWidth,reasonY,reasonHeights,reasons,bodyY,bodyRows:body.rows,bodySize:body.size,bodyLineHeight:body.lineHeight,product,height:1600};
}
function render(canvas,data,img=null){
 if(data.template&&data.template!=='drawing'&&extras()?.renderers[data.template])return extras().render(canvas,data,img,{wrap});
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
  verticalBrush(ctx);
 }
 const left=l.left;
 ctx.fillStyle='#131313';lines(ctx,'PURCHASE\nJUSTIFICATION\nBUREAU',style==='drawing'?left:62,55,250,18,24,800);
 font(ctx,style==='drawing'?13:17,600);ctx.fillText('No. '+data.number,style==='drawing'?510:490,62);cross(ctx,822,69);
 ctx.fillStyle='#080808';lines(ctx,'購入正当化\n認定書。',left-4,155,750,76,86,900);
 font(ctx,20,700);ctx.fillText('CERTIFICATE OF JUSTIFICATION',left,340);
 if(img&&style!=='drawing')photo(ctx,img,405,385,430,365);
 else if(!img&&style!=='drawing'){ctx.strokeStyle='#b9b8af';ctx.lineWidth=1;ctx.strokeRect(420,395,400,345);cross(ctx,620,530,36);font(ctx,15,500);ctx.fillStyle='#555a62';ctx.fillText('THE VALUE IS IN YOUR REASONS.',450,640);}
 ctx.fillStyle='#111';font(ctx,17,700);ctx.fillText('ITEM / 購入品',left,390);
 font(ctx,l.product.size,800);l.product.rows.forEach((row,i)=>ctx.fillText(row,left,425+i*l.product.lineHeight));
 const priceY=style==='drawing'?640:683;
 rule(ctx,left,priceY,44);font(ctx,17,700);ctx.fillText('PRICE / 購入金額',left,priceY+15);
 let priceSize=40;const price='¥'+data.amount.toLocaleString('ja-JP');font(ctx,priceSize,800);while(ctx.measureText(price).width>310&&priceSize>20){font(ctx,--priceSize,800);}ctx.fillText(price,left,priceY+43);
 font(ctx,17,700);ctx.fillText('REASONS',left,l.reasonY);let ry=l.reasonY+32;
 l.reasons.forEach((r,i)=>{rule(ctx,left,ry,l.contentWidth);font(ctx,21,600);ctx.fillText(String(i+1).padStart(2,'0'),left+18,ry+10);lines(ctx,r,left+91,ry+9,l.reasonWidth,24,30,500);ry+=l.reasonHeights[i];});rule(ctx,left,ry,l.contentWidth);
 ctx.fillStyle='#141414';font(ctx,17,700);ctx.fillText('JUSTIFICATION',left,l.bodyY-40);
 font(ctx,l.bodySize);l.bodyRows.forEach((row,i)=>ctx.fillText(row,left,l.bodyY+i*l.bodyLineHeight));
 const foot=1520;rule(ctx,64,foot-25,772);font(ctx,16,700);ctx.fillText('PURCHASE JUSTIFICATION BUREAU',64,foot);cross(ctx,816,foot+10,16);
 font(ctx,15);ctx.fillText('購入正当化審査室  /  架空の機関による、楽しむための認定書です。',64,foot+31);
 return {width:canvas.width,height:canvas.height,layout:l};
}
const api={templates,wrap,layout,render,photoOpacity,brushOpacity};root.IiwakeCertificate=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
