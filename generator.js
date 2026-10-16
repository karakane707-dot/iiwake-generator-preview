(function(root){
'use strict';
const P=typeof module!=='undefined'&&module.exports?require('./phrases.js'):root.IiwakePhrases;
const pick=(list,rng)=>list[Math.min(list.length-1,Math.max(0,Math.floor(rng()*list.length)))];
function parseAmount(value){
 const s=String(value).trim().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/，/g,',');
 if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(s))return null;
 const n=Number(s.replace(/,/g,''));
 return Number.isSafeInteger(n)&&n>=0&&n<=999999999999?n:null;
}
function validate(input){
 if(!Number.isInteger(input.category)||!P.categories[input.category])throw new Error('商品分類を選択してください。');
 if(typeof input.product!=='string'||!input.product.trim()||input.product.trim().length>100)throw new Error('商品名は1〜100文字で入力してください。');
 if(!Number.isSafeInteger(input.amount)||input.amount<0||input.amount>999999999999)throw new Error('購入金額は0〜999,999,999,999円の整数で入力してください。');
 if(!Array.isArray(input.reasons)||input.reasons.length>3||new Set(input.reasons).size!==input.reasons.length||input.reasons.some(id=>!Number.isInteger(id)||!P.reasons[id]))throw new Error('購入理由は最大3つ選んでください。');
 if(!Number.isInteger(input.recipient)||!P.recipients[input.recipient])throw new Error('相手の選択内容を確認してください。');
}
function amountSentence(amount,rng){
 const yen=amount.toLocaleString('ja-JP')+'円';
 const tier=amount===0?['申告金額は0円であり、金銭的支出以外の「選ぶ楽しみ」も評価の対象となります','申告金額は0円ですが、手に入れたいと思った気持ちまで無料扱いする必要はありません']:amount<10000?[`購入金額${yen}は、日常の楽しみに充てた支出という観点から説明できます`,`今回の${yen}については、金額だけでなく、それで得たい楽しみと合わせて捉える余地があります`]:amount<100000?[`購入金額${yen}は、楽しみや愛着にどれだけ重きを置くかという選択として説明できます`,`今回の${yen}は、単なる所有に限らず、選び、楽しむ体験への支出という見方もできます`]:[`購入金額${yen}については、金額の大きさに加え、本人が何に価値を感じたのかを示すことが説明の軸となります`,`今回の${yen}は、本人が大切にしたい楽しみへの配分として説明する余地があります`];
 return pick(tier,rng);
}
function compose(input,rng){
 const cat=P.categories[input.category];
 let basis=input.reasons.map(id=>P.reasons[id].basis).join('、');
 let reason=basis?`${pick(['申告された背景を整理すると','購入の経緯としては','今回の判断を支えたのは'],rng)}、${basis}が挙げられ、これらを合わせて今回の選択の背景と捉えます`:'購入理由の個別申告はありませんが、自ら選びたいと思った対象として検討します';
 if(input.reasons.includes(14)||input.reasons.includes(15))reason+='（今後の価格や価値が上がることを保証するものではありません）';
 return [pick([`申告内容に基づき、「${input.product.trim()}」の購入について検討しました`,`本審査室は、「${input.product.trim()}」の購入に至る事情を確認しました`,`今回の審査対象である「${input.product.trim()}」について、購入者の申告をもとに見解を示します`],rng),`${cat[0]}という分類では、${pick(cat.slice(1),rng)}も、価格だけでは測れない判断材料となり得ます`,reason,amountSentence(input.amount,rng),pick(P.recipientTexts[input.recipient],rng),pick(P.closings,rng)].map(s=>s+'。').join('\n');
}
function generate(input,previous='',rng=Math.random){
 validate(input);
 for(let i=0;i<12;i++){const text=compose(input,rng);if(text!==previous)return text;}
 // 固定乱数や偶然の連続一致でも、必ず直前とは異なる結びにする。
 const text=compose(input,rng), lines=text.split('\n');
 lines[lines.length-1]=P.closings.find(c=>c+'。'!==lines[lines.length-1])+'。';
 return lines.join('\n');
}
root.IiwakeGenerator={parseAmount,validate,generate};
if(typeof module!=='undefined')module.exports=root.IiwakeGenerator;
})(globalThis);
