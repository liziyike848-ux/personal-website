(() => {
  const chapters = [...document.querySelectorAll("section.chapter")];
  const navigation = [...document.querySelectorAll(".chapter-nav a")];
  const progress = document.getElementById("reading-progress");
  const topbar = document.querySelector(".topbar");
  let activeId = "";

  function setActiveNavigation(id) {
    if (activeId === id) return;
    activeId = id;
    navigation.forEach(link => {
      const active = link.hash === `#${activeId}`;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function updateReading() {
    const page = document.documentElement;
    const distance = page.scrollHeight - window.innerHeight;
    const ratio = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 1;
    progress.style.transform = `scaleX(${ratio})`;
    progress.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    topbar.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", updateReading, { passive: true });
  window.addEventListener("resize", updateReading);
  window.addEventListener("pageshow", updateReading);
  document.querySelectorAll("details").forEach(details => details.addEventListener("toggle", updateReading));
  new ResizeObserver(updateReading).observe(document.querySelector("main"));
  document.getElementById("year").textContent = new Date().getFullYear();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveNavigation(entry.target.id);
    });
  }, { threshold: 0.4 });
  chapters.forEach(chapter => observer.observe(chapter));

  const dialogs = [...document.querySelectorAll(".essay-dialog")];
  const articleLinks = [...document.querySelectorAll("[data-dialog]")];
  let returnHash = "";
  let opener = null;
  function syncArticle() {
    const selected = dialogs.find(dialog => `#${dialog.id}` === location.hash);
    dialogs.forEach(dialog => {
      if (dialog.open && dialog !== selected) dialog.close();
    });
    if (selected && !selected.open) selected.showModal();
  }
  articleLinks.forEach(link => {
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnHash = location.hash;
      opener = link;
      // Keep article hashes shareable without scrolling the reading page.
      history.pushState(null, "", link.hash);
      syncArticle();
    });
  });
  dialogs.forEach(dialog => {
    dialog.addEventListener("click", event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (location.hash === `#${dialog.id}`) {
        history.replaceState(null, "", returnHash || "#thoughts");
        if (opener) opener.focus({ preventScroll: true });
      }
      updateReading();
    });
  });
  window.addEventListener("hashchange", syncArticle);
  window.addEventListener("popstate", syncArticle);
  if (dialogs.some(dialog => `#${dialog.id}` === location.hash)) {
    document.getElementById("thoughts").scrollIntoView({ behavior: "instant" });
  }
  syncArticle();
  updateReading();
})();
