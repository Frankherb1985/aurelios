const $=(q,el=document)=>el.querySelector(q);
const icons={
 AAPL:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/apple.svg",
 TSLA:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tesla.svg",
 NVDA:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nvidia.svg",
 MSFT:"https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/microsoft.svg"
};
const state={
 watch:[
  {sym:"AAPL",price:177.18,change:+0.0112},
  {sym:"TSLA",price:236.75,change:-0.0199},
  {sym:"NVDA",price:917.23,change:+0.0085},
  {sym:"MSFT",price:402.54,change:+0.002}
 ]
};

function renderHeader(){
 $('[data-role="build"]').textContent=`Build: ${new Date().toISOString().slice(0,16).replace('T',' ')}`;
}

function renderWatch(){
 const host=$("#watchlist");
 host.innerHTML="";
 state.watch.forEach(s=>{
   const c=s.change>=0?"pos":"neg";
   const row=document.createElement("div");
   row.className="stock";
   row.innerHTML=`
     <div class="left">
       <div class="stock-icon"><img src="${icons[s.sym]}" alt="${s.sym}" /></div>
       <div>${s.sym}</div>
     </div>
     <div class="right">
       <div class="price">${s.price.toFixed(2)}</div>
       <div class="change ${c}">${(s.change*100).toFixed(2)}%</div>
     </div>
   `;
   host.appendChild(row);
 });
}

function animateRisk(){
 const ring=$('[data-role="riskArc"]');
 const val=$('[data-role="riskVal"]');
 let risk=86;
 const C=2*Math.PI*45;
 ring.style.strokeDasharray=C;
 ring.style.strokeDashoffset=(1-risk/100)*C;
 val.textContent=risk+"%";
}

renderHeader();
renderWatch();
animateRisk();
