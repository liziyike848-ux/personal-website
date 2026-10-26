(() => {
  const chapters = [...document.querySelectorAll("section.chapter")];
  const navigation = [...document.querySelectorAll(".chapter-nav a")];
  const progress = document.getElementById("reading-progress");
  const topbar = document.querySelector(".topbar");
  let frame = 0;
  let activeId = "";

  function updateReading() {
    frame = 0;
    const page = document.documentElement;
    const distance = page.scrollHeight - window.innerHeight;
    const percentage = distance > 0 ? Math.round(Math.max(0, Math.min(1, window.scrollY / distance)) * 100) : 100;
    progress.value = percentage;
    progress.textContent = `${percentage}%`;
    const probe = topbar.getBoundingClientRect().bottom + 100;
    let current = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= probe) current = chapter;
    }
    if (distance > 0 && window.scrollY >= distance - 2) current = chapters[chapters.length - 1];
    if (activeId === current.id) return;
    activeId = current.id;
    navigation.forEach(link => {
      const active = link.hash === `#${activeId}`;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(updateReading);
  }
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("pageshow", scheduleUpdate);
  document.querySelectorAll("details").forEach(details => details.addEventListener("toggle", scheduleUpdate));
  new ResizeObserver(scheduleUpdate).observe(document.querySelector("main"));
  document.getElementById("year").textContent = new Date().getFullYear();

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
      scheduleUpdate();
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
