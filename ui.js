// Tabs + small helpers
(function () {
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    trade: document.getElementById('view-trade'),
    settings: document.getElementById('view-settings')
  };
  document.querySelectorAll('.tabbar button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tabbar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      Object.values(views).forEach(v => v.classList.remove('active'));
      views[tab].classList.add('active');
    };
  });
})();
