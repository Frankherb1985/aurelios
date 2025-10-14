const state={
  cash:10000,equity:10000,riskPct:86,
  watch:[
    {sym:'AAPL',price:177.18,chg:+1.12},
    {sym:'TSLA',price:236.75,chg:-1.99},
    {sym:'NVDA',price:917.23,chg:+0.85},
    {sym:'MSFT',price:402.54,chg:+0.20}
  ]
};
const $=s=>document.querySelector(s);
const fmt=n=>n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
$('[data-role="cash"]').textContent=`$${fmt(state.cash)}`;
$('[data-role="equity"]').textContent=`$${fmt(state.equity)}`;

const list=$('#watchlist');
state.watch.forEach(w=>{
  const li=document.createElement('li');
  const left=document.createElement('div');
  left.innerHTML=`<div class="sym">${w.sym}</div>
    <div class="chg ${w.chg>=0?'up':'down'}">${w.chg>=0?'+':''}${w.chg.toFixed(2)}%</div>`;
  const right=document.createElement('div');
  right.className='price'; right.textContent=fmt(w.price);
  li.append(left,right); list.append(li);
});

(function setRisk(p){
  p=Math.max(0,Math.min(100,p));
  document.querySelector('.fg').setAttribute('stroke-dasharray',`${p},100`);
  $('[data-role="riskPct"]').textContent=`${p}%`;
  $('#riskBar').style.width=p+'%';
})(state.riskPct);

const sel=$('#qtSym');
state.watch.forEach(w=>{
  const o=document.createElement('option');
  o.value=w.sym;o.textContent=w.sym;sel.append(o);
});
function updatePrice(){
  const r=state.watch.find(x=>x.sym===sel.value);
  if(r)$('#qtPx').value=r.price.toFixed(2);
}
sel.addEventListener('change',updatePrice);updatePrice();

$('#tradeForm').addEventListener('submit',e=>{
  e.preventDefault();
  const b=$('#reviewBtn');b.disabled=true;b.querySelector('span').textContent='Order Reviewed';
  setTimeout(()=>{b.disabled=false;b.querySelector('span').textContent='Review';},1800);
});
