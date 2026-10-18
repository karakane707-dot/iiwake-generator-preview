/* 02–05専用。写真・文字を実データから描く。01の描画には関与しない。 */
(function(root){
'use strict';
const SANS='"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", Meiryo, sans-serif';
const SERIF='"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Noto Sans JP", serif';
const specs={classic:{left:76,width:748,reasonY:810,serif:true},official:{left:52,width:618,reasonY:810},minimal:{left:76,width:748,reasonY:810},editorial:{left:76,width:748,reasonY:810}};
function type(c,size,weight=400,serif=false){c.font=`${weight} ${size}px ${serif?SERIF:SANS}`;}
function text(c,s,x,y,size=20,weight=400,serif=false){type(c,size,weight,serif);c.fillText(s,x,y);}
function line(c,x,y,w,color='#c8c4ba'){c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();}
function fail(message){const e=Error(message);e.code='LAYOUT_OVERFLOW';throw e;}
function fit(c,s,w,h,sizes,wrap,serif=false){for(const size of sizes){type(c,size,400,serif);const rows=wrap(c,s,w),lineHeight=Math.ceil(size*1.43);if(rows.length*lineHeight<=h)return {rows,size,lineHeight};}fail('認定文章が1枚に収まりません。文章を短くするか、不要な改行を減らしてください。内容は保持しています。');}
function layout(c,d,wrap){
 const spec=specs[d.template],reasonY=spec.reasonY;
 type(c,24);const reasons=d.reasons.length?d.reasons:['理由の指定なし'],reasonHeights=reasons.map(r=>Math.max(44,wrap(c,r,spec.width-72).length*30+12));
 const bodyY=reasonY+30+reasonHeights.reduce((a,b)=>a+b,0)+56;
 const body=fit(c,d.text,spec.width,1460-bodyY,[26,24,22],wrap,spec.serif);
 let product;for(const size of [30,28,26,24,22]){type(c,size,700,spec.serif);const rows=wrap(c,d.product,292),lineHeight=Math.ceil(size*1.4);if(rows.length*lineHeight<=148){product={rows,size,lineHeight};break;}}
 if(!product)fail('商品名が1枚に収まりません。商品名を短くして、再度生成してください。');
 return {...spec,reasonY,reasons,reasonHeights,bodyY,bodyRows:body.rows,bodySize:body.size,bodyLineHeight:body.lineHeight,product,height:1600};
}
function surface(c,w,h){const a=c.canvas.ownerDocument?c.canvas.ownerDocument.createElement('canvas'):new c.canvas.constructor(w,h);a.width=w;a.height=h;return a;}
function random(seed=739){return ()=>{seed=seed*16807%2147483647;return seed/2147483647;};}
function paper(c,color,grain=false){c.fillStyle=color;c.fillRect(0,0,900,1600);if(grain){const r=random();for(let i=0;i<16000;i++){c.fillStyle=`rgba(99,73,40,${.015+r()*.04})`;c.fillRect(r()*900,r()*1600,.5+r()*1.5,.5+r()*1.5);}}}
// 02〜04は確定済みトリミングと同じ86:110。追加の上下切り捨てをしない。
const photoFrames={classic:{x:440,y:290,w:390,h:390*1100/860},official:{x:430,y:275,w:390,h:390*1100/860},minimal:{x:450,y:290,w:390,h:390*1100/860}};
function fadeOpacity(u,v){const smooth=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};const x=Math.min(u,1-u),y=Math.min(v,1-v);return smooth(x/.11)*smooth(y/.085);}
function positionedPhoto(c,img,id){const f=photoFrames[id];photo(c,img,f.x,f.y,f.w,f.h,{fade:true});}
// 写真は確定済み構図から描く。モノクロは別Canvas上の画素だけを変換。
function photo(c,img,x,y,w,h,{fade=false,mono=false,torn=false}={}){
 if(!img)return;
 const p=surface(c,Math.ceil(w*1.2),Math.ceil(h*1.2)),g=p.getContext('2d'),scale=Math.max(p.width/img.width,p.height/img.height),sw=p.width/scale,sh=p.height/scale;
 g.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,0,0,p.width,p.height);
 if(mono||fade||torn){const pixels=g.getImageData(0,0,p.width,p.height),a=pixels.data,smooth=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
 for(let yy=0;yy<p.height;yy++)for(let xx=0;xx<p.width;xx++){const i=(yy*p.width+xx)*4,u=xx/(p.width-1),v=yy/(p.height-1);
 if(mono){const lum=.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];a[i]=a[i+1]=a[i+2]=Math.max(0,Math.min(255,(lum-128)*1.08+128));}
 if(fade)a[i+3]*=fadeOpacity(u,v);
 if(torn){const edge=.018+.008*Math.sin(v*89)+.006*Math.sin(v*213);a[i+3]*=smooth((u-edge)*200)*smooth((1-u-edge*.6)*200);}
 }g.putImageData(pixels,0,0);}
 c.drawImage(p,x,y,w,h);
}
function header(c,d,l){c.fillStyle='#151515';['PURCHASE','JUSTIFICATION','BUREAU'].forEach((s,i)=>text(c,s,l.left,55+i*22,17,700));text(c,'No. '+d.number,d.template==='official'?430:570,57,d.template==='official'?12:14,600);}
function title(c,l,y,size=65){c.fillStyle='#0c0c0c';text(c,'購入正当化',l.left,y,size,800,l.serif);text(c,'認定書。',l.left,y+size*1.15,size,800,l.serif);text(c,'CERTIFICATE OF JUSTIFICATION',l.left,y+size*2.45,18,700);}
function category(d){const P=root.IiwakePhrases||(typeof module!=='undefined'?require('./phrases.js'):null);return P?.categories?.[d.category]?.[0]||'その他';}
function item(c,d,l){c.fillStyle='#181818';text(c,'ITEM / 購入品',l.left,405,17,700);type(c,l.product.size,700,l.serif);l.product.rows.forEach((s,i)=>c.fillText(s,l.left,436+i*l.product.lineHeight));text(c,'分類 / '+category(d),l.left,598,16);line(c,l.left,636,42);text(c,'PRICE / 購入金額',l.left,659,17,700);let size=42;const price='¥'+d.amount.toLocaleString('ja-JP');type(c,size,700);while(c.measureText(price).width>300&&size>20)type(c,--size,700);c.fillText(price,l.left,690);}
function content(c,d,l,wrap){c.fillStyle='#141414';text(c,'REASONS',l.left,l.reasonY,17,700);let y=l.reasonY+30;for(let i=0;i<l.reasons.length;i++){line(c,l.left,y,l.width);text(c,String(i+1).padStart(2,'0'),l.left+8,y+8,21,600);type(c,24);wrap(c,l.reasons[i],l.width-72).forEach((s,j)=>c.fillText(s,l.left+64,y+8+j*30));y+=l.reasonHeights[i];}line(c,l.left,y,l.width);text(c,'JUSTIFICATION',l.left,l.bodyY-36,17,700);type(c,l.bodySize,400,l.serif);l.bodyRows.forEach((s,i)=>c.fillText(s,l.left,l.bodyY+i*l.bodyLineHeight));}
function footer(c,l){line(c,l.left,1493,l.width);c.fillStyle='#171717';text(c,'PURCHASE JUSTIFICATION BUREAU',l.left,1513,16,700);text(c,'購入正当化審査室 / 架空の機関による、楽しむための認定書です。',l.left,1544,13);}
function ornament(c){c.strokeStyle='#8c7352';c.lineWidth=1;c.strokeRect(27,25,846,1550);c.strokeRect(36,34,828,1532);for(const [x,y,sx,sy] of [[36,34,1,1],[864,34,-1,1],[36,1566,1,-1],[864,1566,-1,-1]]){c.save();c.translate(x,y);c.scale(sx,sy);c.beginPath();c.moveTo(0,62);c.bezierCurveTo(5,26,37,32,43,0);c.moveTo(0,42);c.bezierCurveTo(31,44,20,12,62,0);c.stroke();for(let i=0;i<3;i++){c.beginPath();c.ellipse(10+i*12,12+i*8,8,3,-.7,0,Math.PI*2);c.stroke();}c.restore();}}
function seal(c){c.save();c.translate(746,226);c.strokeStyle='#796746';c.fillStyle='#796746';for(const r of [66,61,49]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();}for(let i=0;i<40;i++){const a=i*Math.PI/20;c.beginPath();c.moveTo(Math.cos(a)*54,Math.sin(a)*54);c.lineTo(Math.cos(a)*58,Math.sin(a)*58);c.stroke();}c.textAlign='center';text(c,'PJB',0,-24,38,500,true);text(c,'CERTIFIED',0,24,10,600);c.beginPath();c.moveTo(0,-46);c.lineTo(3,-39);c.lineTo(0,-32);c.lineTo(-3,-39);c.closePath();c.fill();c.restore();}
function classic(c,d,img,l,h){paper(c,'#f6efdf',true);positionedPhoto(c,img,'classic');ornament(c);header(c,d,l);seal(c);title(c,l,218,64);item(c,d,l);content(c,d,l,h.wrap);footer(c,l);}
function editorial(c,d,img,l,h){
 paper(c,'#f3ebdf',true);c.fillStyle='#22201e';c.fillRect(700,0,200,1600);
 positionedPhoto(c,img,'official');
 // 写真と重ならない下側の帯に全文を収める。フォント差も実測で吸収。
 c.save();c.translate(867,825);c.rotate(Math.PI/2);c.fillStyle='#a88a62';
 let size=94;type(c,size,500,true);while(c.measureText('CERTIFIED CHOICE').width>590&&size>24)type(c,--size,500,true);
 c.fillText('CERTIFIED CHOICE',0,0);c.restore();
 header(c,d,l);title(c,l,150,72);
 // 写真の左端に揃えた上部キャプション。商品情報と独立した2行にまとめる。
 c.fillStyle='#191817';let copySize=28;type(c,copySize,400,true);while(c.measureText('GOOD CHOICE').width>246&&copySize>18)type(c,--copySize,400,true);c.fillText('GOOD CHOICE',430,166);
 text(c,'FOR A RICHER LIFE.',430,205,18,400,true);line(c,430,240,240,'#a88a62');
 item(c,d,l);content(c,d,l,h.wrap);footer(c,l);c.fillStyle='#e5d8c3';['A choice.','A story.','Your life.'].forEach((s,i)=>text(c,s,729,1450+i*24,17,400,true));
}
function minimal(c,d,img,l,h){paper(c,'#fcfbf8');positionedPhoto(c,img,'minimal');line(c,34,55,0);c.strokeStyle='#c8c4ba';c.beginPath();c.moveTo(34,55);c.lineTo(34,610);c.stroke();header(c,d,l);title(c,l,228,60);item(c,d,l);content(c,d,l,h.wrap);footer(c,l);c.strokeStyle='#171717';c.beginPath();c.moveTo(807,1520);c.lineTo(839,1520);c.moveTo(823,1504);c.lineTo(823,1536);c.stroke();}
function tornPaper(c,x,y,w,h,color,seed){const r=random(seed);c.fillStyle=color;c.beginPath();c.moveTo(x,y);for(let yy=0;yy<=h;yy+=12)c.lineTo(x+r()*9,y+yy);for(let xx=0;xx<=w;xx+=12)c.lineTo(x+xx,y+h-r()*9);for(let yy=h;yy>=0;yy-=12)c.lineTo(x+w-r()*9,y+yy);for(let xx=w;xx>=0;xx-=12)c.lineTo(x+xx,y+r()*9);c.closePath();c.fill();}
function collage(c,d,img,l,h){paper(c,'#e5d8c5',true);tornPaper(c,38,0,810,1600,'#f7f3e9',43);c.save();c.translate(510,340);c.rotate(-.11);tornPaper(c,-30,-25,330,410,'#d6ccba',71);c.restore();if(img){c.save();c.translate(480,330);c.rotate(.065);photo(c,img,0,0,330,330*1100/860,{mono:true,torn:true});c.restore();}else {c.fillStyle='#d8d2c6';c.fillRect(490,386,300,350);c.fillStyle='#655f56';text(c,'A PERSONAL',515,510,25,400,true);text(c,'CHOICE.',515,548,36,400,true);}
 c.save();c.translate(498,358);c.rotate(-.13);c.fillStyle='rgba(185,147,85,.38)';c.fillRect(0,0,190,34);c.restore();c.save();c.translate(700,762);c.rotate(.11);c.fillStyle='rgba(185,147,85,.32)';c.fillRect(0,0,153,29);c.restore();
 header(c,d,l);title(c,l,227,61);item(c,d,l);c.save();c.translate(620,161);c.rotate(-.2);c.fillStyle='#242321';c.font='italic 31px cursive';['Good Choice','For a','Richer Life.'].forEach((s,i)=>c.fillText(s,0,i*38));c.restore();
 content(c,d,l,h.wrap);footer(c,l);
 // 細い植物の切り絵は本文の右側だけに置く。
 c.save();c.translate(866,1330);c.strokeStyle='#302e29';c.fillStyle='#302e29';c.lineWidth=2;c.beginPath();c.moveTo(0,120);c.quadraticCurveTo(-15,0,0,-155);c.stroke();for(let i=0;i<7;i++){c.save();c.translate(-3,90-i*35);c.rotate(i%2?-.5:.5);c.beginPath();c.ellipse(i%2?10:-10,-16,7,24,i%2?.4:-.4,0,Math.PI*2);c.fill();c.restore();}c.restore();}
const renderers={classic,official:editorial,minimal,editorial:collage};
function render(canvas,d,img,helpers){let c=canvas.getContext('2d');if(!c)throw Error('このブラウザでは画像を作成できません。');const l=layout(c,d,helpers.wrap);canvas.width=1080;canvas.height=1920;c=canvas.getContext('2d');c.scale(1.2,1.2);c.textBaseline='top';renderers[d.template](c,d,img,l,helpers);return {width:1080,height:1920,layout:l};}
const api={layout,render,renderers,photo,photoFrames,fadeOpacity};root.IiwakeExtraTemplates=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
