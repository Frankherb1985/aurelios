const $=(q,el=document)=>el.querySelector(q);
const money=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
const pct=n=>`${(n>=0?'+':'')}${(n*100).toFixed(2)}%`;
const state={cash:10000,watch:[{sym:'AAPL',last:177.18,change:+0.0112},{sym:'TSLA',last:236.75,change:-0.0198},{sym:'NVDA',last:917.23,change:+0.0085},{sym:'MSFT',last:402.54,change:+0.0020}],positions:[],trades:[],policy:{risk:200,daily:500,position:5000}};
const el={cash:$('[data-role="cash"]'),equity:$('[data-role="equity"]'),riskArc:$('[data-role="riskArc"]'),riskVal:$('[data-role="riskVal"]'),goldbar:$('[data-role="goldbar"]'),build:$('[data-role="build"]'),msg:$('[data-role="msg"]')};

const priceOf=sym=>(state.watch.find(w=>w.sym===sym)||{last:0}).last;
const equity=()=>state.cash+state.positions.reduce((a,p)=>a+p.qty*priceOf(p.sym),0);

function renderHeader(){el.cash.textContent=money(state.cash);el.equity.textContent=money(equity());el.build.textContent='Build: '+new Date().toISOString().slice(0,16).replace('T',' ');}
function renderWatch(){
 const host=$("#watchlist");host.innerHTML='';
 state.watch.forEach(w=>{
  const c=w.change>=0?'pos':'neg';
  const id=w.sym==='AAPL'?'ico-aapl':w.sym==='TSLA'?'ico-tsla':w.sym==='NVDA'?'ico-nvda':'ico-msft';
  const row=document.createElement('div');
  row.className='w-row';
  row.innerHTML=`<div class="w-left"><div class="badge"><svg><use href="#${id}" xlink:href="#${id}"></use></svg></div><div>${w.sym}</div></div><div><div>${w.last.toFixed(2)}</div><div class="change ${c}">${pct(w.change)}</div></div>`;
  host.appendChild(row);
 });
}
function renderRisk(){const r=0;const C=2*Math.PI*46;el.riskArc.style.strokeDasharray=C;el.riskArc.style.strokeDashoffset=(1-r)*C;el.riskVal.textContent=Math.round(r*100)+'%';}
function renderGoldbar(){el.goldbar.style.width='60%';}
function tick(){state.watch.forEach(w=>{const d=1+(Math.random()*0.002-0.001);const p=w.last;w.last=+(w.last*d).toFixed(2);w.change=(w.last-p)/p;});renderWatch();}
setInterval(tick,6000);
renderHeader();renderWatch();renderRisk();renderGoldbar();
