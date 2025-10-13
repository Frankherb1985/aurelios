// Minimal UI feedback (ripple on buttons/tabs)
document.addEventListener('click', (e)=>{
  const t = e.target.closest('.btn, .tabbar button');
  if(!t) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = t.getBoundingClientRect();
  r.style.left = `${e.clientX - rect.left}px`;
  r.style.top  = `${e.clientY - rect.top }px`;
  t.appendChild(r);
  setTimeout(()=>r.remove(), 500);
});
