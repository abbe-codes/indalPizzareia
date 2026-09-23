"use strict";

const header = document.querySelector("#site-header");
const hero = document.querySelector(".hero");
const video = document.querySelector("#hero-video");
const videoToggle = document.querySelector("#video-toggle");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const categoryLinks = [...document.querySelectorAll(".category-links a")];
const categories = [...document.querySelectorAll(".menu-category")];
const categoryNav = document.querySelector(".category-nav");
const menuSection = document.querySelector("#meny");

document.querySelector("#year").textContent = String(new Date().getFullYear());

function updateVideoControl() {
  const paused = video.paused;
  videoToggle.setAttribute("aria-label", paused ? "Spela bakgrundsvideo" : "Pausa bakgrundsvideo");
  videoToggle.querySelector("span").textContent = paused ? "Spela video" : "Pausa video";
  videoToggle.querySelector("use").setAttribute("href", paused ? "#icon-play" : "#icon-pause");
}

async function playVideo() {
  const source = video.querySelector("source");
  if (!source.hasAttribute("src")) {
    source.src = source.dataset.src;
    video.load();
  }

  try {
    await video.play();
  } catch {
    // Autoplay can be blocked by the browser; keep the poster and manual control.
    updateVideoControl();
  }
}

function showVideoFallback() {
  video.hidden = true;
  videoToggle.hidden = true;
}

video.addEventListener("play", updateVideoControl);
video.addEventListener("pause", updateVideoControl);
video.addEventListener("error", showVideoFallback);
video.querySelector("source").addEventListener("error", showVideoFallback);
videoToggle.hidden = false;
videoToggle.addEventListener("click", () => {
  if (video.paused) {
    void playVideo();
  } else {
    video.pause();
  }
});

if (!motionPreference.matches) {
  void playVideo();
}
motionPreference.addEventListener("change", (event) => {
  if (event.matches) video.pause();
});

function updateNavigation() {
  header.classList.toggle("is-scrolled", window.scrollY > 32);

  const offset = header.offsetHeight + categoryNav.offsetHeight + 40;
  const withinMenu = menuSection.getBoundingClientRect().bottom > offset;
  const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  const current = withinMenu
    ? (atPageEnd ? categories.at(-1) : categories.findLast((category) => category.getBoundingClientRect().top <= offset))
    : undefined;

  for (const link of categoryLinks) {
    if (current && link.hash === `#${current.id}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

let scrollPending = false;
window.addEventListener("scroll", () => {
  if (scrollPending) return;
  scrollPending = true;
  window.requestAnimationFrame(() => {
    updateNavigation();
    scrollPending = false;
  });
}, { passive: true });
window.addEventListener("resize", updateNavigation);
updateNavigation();

// Stop background decoding while the page or video is out of view.
let resumeWhenVisible = false;
const heroObserver = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) {
    resumeWhenVisible = !video.paused;
    video.pause();
  } else if (resumeWhenVisible && !motionPreference.matches && !document.hidden) {
    resumeWhenVisible = false;
    void playVideo();
  }
});
heroObserver.observe(hero);

let resumeAfterTabSwitch = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resumeAfterTabSwitch = !video.paused;
    video.pause();
  } else if (resumeAfterTabSwitch && !motionPreference.matches && hero.getBoundingClientRect().bottom > 0) {
    resumeAfterTabSwitch = false;
    void playVideo();
  }
});
