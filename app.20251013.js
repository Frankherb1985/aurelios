document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tabbar button");
  const views = document.querySelectorAll(".view");
  const buildTime = document.getElementById("build-time");
  const now = new Date();
  buildTime.textContent = now.toISOString().slice(0, 16).replace("T", " ");

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const id = `#view-${btn.dataset.tab}`;
      views.forEach((v) => v.classList.remove("active"));
      document.querySelector(id).classList.add("active");
    });
  });

  document.querySelector("[data-role='trade-form']").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Trade submitted!");
  });

  document.querySelector("[data-role='notes-save']").addEventListener("click", () => {
    alert("Notes saved.");
  });
});
