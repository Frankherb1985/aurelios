document.addEventListener("DOMContentLoaded", () => {
  const build = document.getElementById("build-time");
  const now = new Date();
  build.textContent = now.toISOString().slice(0, 16).replace("T", " ");
});
