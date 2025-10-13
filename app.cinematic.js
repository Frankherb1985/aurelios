const watch = [
  { sym:"AAPL", price:177.18, chg:+1.12, icon:"✓" },
  { sym:"TSLA", price:236.75, chg:-1.99, icon:"T" },
  { sym:"NVDA", price:917.23, chg:+0.85, icon:"N" },
  { sym:"MSFT", price:402.54, chg:+0.20, icon:"M" },
];
const fmt=n=>n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>`${v>0?'+':''}${v.toFixed(2)}%`;
const $=s=>document.querySelector(s);
(function setBuild(){
  const t=new Date().toISOString().slice(0,16).replace('T',' ');
  $('[data-role="build"]').textContent=`Build: ${t}`;
})();
function renderWatch(){
  const wrap=document.getElementById('watchlist');
  wrap.innerHTML='';
  watch.forEach(i=>{
    const row=document.createElement('div');
    row.className='row-item';
    row.innerHTML=`
      <div class="logo">${i.icon}</div>
      <div class="sym">${i.sym}</div>
      <div class="spacer"></div>
      <div class="px">${fmt(i.price)}</div>
      <div class="chg ${i.chg>0?'pos':i.chg<0?'neg':'flat'}">${pct(i.chg)}</div>`;
    wrap.append(row);
  });
}
renderWatch();
/* RISK ring animation */
(function risk(){
  const arc=$('[data-role="riskArc"]');
  const val=86;
  const max=283,target=max*(1-val/100);
  let cur=max;
  const step=()=>{
    cur-=(cur-target)*0.1;
    if(Math.abs(cur-target)<0.5)cur=target;
    arc.style.strokeDashoffset=cur;
    if(cur!==target)requestAnimationFrame(step);
  };
  const svg=document.querySelector('.risk-circle svg');
  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  const grad=document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
  grad.setAttribute('id','goldGrad');
  grad.innerHTML=`<stop offset="0%" stop-color="#4a3b14"/><stop offset="45%" stop-color="#c6a442"/><stop offset="55%" stop-color="#ffea94"/><stop offset="65%" stop-color="#bf9631"/><stop offset="100%" stop-color="#4a3b14"/>`;
  defs.append(grad);svg.insertBefore(defs,svg.firstChild);
  $('[data-role="riskVal"]').textContent=`${val}%`;requestAnimationFrame(step);
})();
/* Gold shimmer bar */
(function goldbar(){
  const el=$('[data-role="goldbar"]');
  let w=40;setInterval(()=>{w=30+Math.random()*50;el.style.width=`${w}%`;},1500);
})();
if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(e=>e.update()));}
