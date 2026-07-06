const menuButton = document.getElementById("menu-button");
const menuDrawer = document.getElementById("menu-drawer");
const homeHeaderLogo = document.querySelector(".page-home .brand-mark--header img");
const homeHeaderBrand = document.querySelector(".page-home .brand-mark--header");
const homeMenuBrand = document.querySelector(".page-home .brand-mark--menu");
const homeMenuButton = document.querySelector(".page-home .menu-button");
const siteHeader = document.querySelector(".site-header");
const homeScrollLogoFrames = [
  "./logos/1.png",
  "./logos/2.png",
  "./logos/3.png",
  "./logos/4.png",
  "./logos/5.png",
  "./logos/6.png",
  "./logos/7.png",
  "./logo.png",
];
let homeScrollLogoFrameIndex = 0;
let homeScrollLogoIntervalId = 0;

window.requestAnimationFrame(() => {
  document.body.classList.add("is-ready");
});

const syncHomeHeaderLogo = () => {
  if (!homeHeaderLogo) {
    return;
  }

  const topSrc = homeHeaderLogo.dataset.logoTop;
  const defaultSrc = homeHeaderLogo.dataset.logoDefault;
  const isScrolled = window.scrollY > 12;
  const isMenuOpen = document.body.classList.contains("menu-open");

  document.body.classList.toggle("is-home-scrolled", isScrolled);

  if (isScrolled && !isMenuOpen) {
    if (!homeScrollLogoIntervalId) {
      homeHeaderLogo.src = homeScrollLogoFrames[homeScrollLogoFrameIndex];
      homeScrollLogoIntervalId = window.setInterval(() => {
        homeScrollLogoFrameIndex = (homeScrollLogoFrameIndex + 1) % homeScrollLogoFrames.length;
        homeHeaderLogo.src = homeScrollLogoFrames[homeScrollLogoFrameIndex];
      }, 125);
    }

    return;
  }

  window.clearInterval(homeScrollLogoIntervalId);
  homeScrollLogoIntervalId = 0;
  homeScrollLogoFrameIndex = 0;
  homeHeaderLogo.src = isMenuOpen ? defaultSrc : topSrc;
};

if (menuButton && menuDrawer) {
  const syncMenuState = (isOpen) => {
    document.body.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuDrawer.setAttribute("aria-hidden", String(!isOpen));
    syncHomeHeaderLogo();
  };

  menuButton.addEventListener("click", () => {
    syncMenuState(!document.body.classList.contains("menu-open"));
  });

  menuDrawer.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.tagName === "A") {
      const link = event.target.getAttribute("href") || "";

      if (link.startsWith("mailto:") || link.startsWith("tel:")) {
        event.preventDefault();
        syncMenuState(false);
        window.setTimeout(() => {
          window.location.href = link;
        }, 120);
        return;
      }

      syncMenuState(false);
      return;
    }

    if (event.target === menuDrawer) {
      syncMenuState(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      syncMenuState(false);
    }
  });
}

const heroPanel = document.querySelector(".page-home .panel--hero");
const heroVideo = document.querySelector(".page-home .hero__video");
const heroContent = document.querySelector(".page-home .hero__content");

if (heroPanel && heroVideo && heroContent) {
  const effectStartSeconds = 6.9;
  const effectEndSeconds = 19;
  let isEffectActive = false;
  let isSwitchingEffect = false;
  let effectSwitchTimeoutId = 0;

  const syncLogoEffectSwitching = (isSwitching) => {
    homeHeaderBrand?.classList.toggle("is-effect-switching", isSwitching);
    homeMenuBrand?.classList.toggle("is-effect-switching", isSwitching);
    homeMenuButton?.classList.toggle("is-effect-switching", isSwitching);
  };

  const getDesiredEffectState = () =>
    heroVideo.currentTime >= effectStartSeconds &&
    heroVideo.currentTime < effectEndSeconds;

  const applyHeroEffectState = (nextState) => {
    heroPanel.classList.toggle("is-effect-active", nextState);
    document.body.classList.toggle("is-home-logo-effect-active", nextState);
    isEffectActive = nextState;
  };

  const syncHeroEffectState = () => {
    const shouldEnableEffect = getDesiredEffectState();

    if (shouldEnableEffect === isEffectActive || isSwitchingEffect) {
      return;
    }

    isSwitchingEffect = true;
    heroContent.classList.add("is-effect-switching");
    syncLogoEffectSwitching(true);
    window.clearTimeout(effectSwitchTimeoutId);

    effectSwitchTimeoutId = window.setTimeout(() => {
      applyHeroEffectState(shouldEnableEffect);

      window.requestAnimationFrame(() => {
        heroContent.classList.remove("is-effect-switching");
        syncLogoEffectSwitching(false);
        isSwitchingEffect = false;
      });
    }, 150);
  };

  heroVideo.addEventListener("timeupdate", syncHeroEffectState);
  heroVideo.addEventListener("seeking", syncHeroEffectState);
  heroVideo.addEventListener("seeked", syncHeroEffectState);
  heroVideo.addEventListener("ended", syncHeroEffectState);
  window.addEventListener("resize", syncHeroEffectState);
  applyHeroEffectState(getDesiredEffectState());
}

if (siteHeader) {
  const syncHeaderScrollState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
    syncHomeHeaderLogo();
  };

  syncHeaderScrollState();
  window.addEventListener("scroll", syncHeaderScrollState, { passive: true });
  window.addEventListener("resize", syncHeaderScrollState);
}

const mediaCarousels = Array.from(document.querySelectorAll("[data-carousel]"));

mediaCarousels.forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const originalSlides = track ? Array.from(track.children) : [];

  if (!track || originalSlides.length <= 1) {
    return;
  }

  originalSlides.forEach((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  const previousButton = document.createElement("button");
  previousButton.className = "content-media__carousel-button content-media__carousel-button--prev";
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "Onceki gorsel");
  previousButton.textContent = "‹";

  const nextButton = document.createElement("button");
  nextButton.className = "content-media__carousel-button content-media__carousel-button--next";
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Sonraki gorsel");
  nextButton.textContent = "›";

  carousel.append(previousButton, nextButton);

  const trackStyles = window.getComputedStyle(track);
  const slideGap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0;
  let offset = 0;
  let animationFrameId = 0;
  let lastTimestamp = 0;
  let pausedUntil = 0;
  let autoplayDirection = 1;
  const speed = 44;
  const interactionPauseMs = 1400;

  const setTrackOffset = () => {
    track.style.transform = `translateX(-${offset}px)`;
  };

  const getFirstSlide = () => track.firstElementChild;
  const getLastSlide = () => track.lastElementChild;

  const normalizeOffset = () => {
    let firstSlide = getFirstSlide();

    while (firstSlide && offset >= firstSlide.getBoundingClientRect().width + slideGap) {
      const consumedWidth = firstSlide.getBoundingClientRect().width + slideGap;
      track.appendChild(firstSlide);
      offset -= consumedWidth;
      firstSlide = getFirstSlide();
    }

    let lastSlide = getLastSlide();

    while (lastSlide && offset < 0) {
      const recycledWidth = lastSlide.getBoundingClientRect().width + slideGap;
      track.insertBefore(lastSlide, track.firstElementChild);
      offset += recycledWidth;
      lastSlide = getLastSlide();
    }
  };

  const step = (timestamp) => {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const isPaused = document.hidden || timestamp < pausedUntil;

    if (isPaused) {
      lastTimestamp = timestamp;
      animationFrameId = window.requestAnimationFrame(step);
      return;
    }

    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    offset += speed * delta * autoplayDirection;
    normalizeOffset();
    setTrackOffset();
    animationFrameId = window.requestAnimationFrame(step);
  };

  const startAutoplay = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || animationFrameId) {
      return;
    }

    lastTimestamp = 0;
    animationFrameId = window.requestAnimationFrame(step);
  };

  const pauseAutoplay = (duration = interactionPauseMs) => {
    pausedUntil = performance.now() + duration;
  };

  const moveByOneSlide = (direction) => {
    autoplayDirection = direction;

    if (direction > 0) {
      const firstSlide = getFirstSlide();

      if (!firstSlide) {
        return;
      }

      offset += firstSlide.getBoundingClientRect().width + slideGap;
    } else {
      const lastSlide = getLastSlide();

      if (!lastSlide) {
        return;
      }

      offset -= lastSlide.getBoundingClientRect().width + slideGap;
    }

    normalizeOffset();
    setTrackOffset();
    pauseAutoplay();
  };

  previousButton.addEventListener("click", () => {
    moveByOneSlide(-1);
  });

  nextButton.addEventListener("click", () => {
    moveByOneSlide(1);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      pauseAutoplay(180);
    }
  });

  setTrackOffset();
  startAutoplay();
});

const referenceRows = Array.from(document.querySelectorAll(".reference-row"));
const projectPreviews = Array.from(document.querySelectorAll(".project-preview"));
const referenceIndicator = document.querySelector(".references-list__indicator");

if (referenceRows.length > 0 && projectPreviews.length > 0) {
  let activeProjectId = "";
  let ticking = false;

  const syncReferenceIndicator = (row) => {
    if (!referenceIndicator || !row) {
      return;
    }

    const indicatorY = row.offsetTop + row.offsetHeight / 2 - referenceIndicator.offsetHeight / 2;
    referenceIndicator.style.transform = `translateY(${indicatorY}px)`;
  };

  const setActiveProject = (projectId) => {
    if (!projectId || projectId === activeProjectId) {
      return;
    }

    activeProjectId = projectId;

    referenceRows.forEach((row) => {
      row.classList.toggle("is-active", row.dataset.project === projectId);

      if (row.dataset.project === projectId) {
        syncReferenceIndicator(row);
      }
    });

    projectPreviews.forEach((preview) => {
      preview.classList.toggle("is-active", preview.dataset.preview === projectId);
    });
  };

  const updateActiveReference = () => {
    ticking = false;

    const focusLine = window.innerHeight * 0.42;
    let closestRow = referenceRows[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    referenceRows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const rowCenter = rect.top + rect.height / 2;
      const distance = Math.abs(rowCenter - focusLine);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestRow = row;
      }
    });

    if (closestRow) {
      syncReferenceIndicator(closestRow);
      setActiveProject(closestRow.dataset.project);
    }
  };

  const requestReferenceUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(updateActiveReference);
  };

  updateActiveReference();
  window.addEventListener("scroll", requestReferenceUpdate, { passive: true });
  window.addEventListener("resize", requestReferenceUpdate);
}

const mobileRevealTargets = Array.from(
  document.querySelectorAll(
    ".why-us, .panel--city, .panel--section3, .panel--gipser, .panel--section4, .panel--section5, .panel--section6, .references-hero, .references-browser, .content-hero, .content-copy, .content-media, .map-embed, .gallery-strip, .site-footer",
  ),
);

if (
  mobileRevealTargets.length > 0 &&
  "IntersectionObserver" in window &&
  window.matchMedia("(max-width: 899px)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  mobileRevealTargets.forEach((element, index) => {
    element.classList.add("reveal-on-scroll");
    element.style.setProperty("--reveal-delay", `${Math.min(index * 35, 180)}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  mobileRevealTargets.forEach((element) => {
    revealObserver.observe(element);
  });
}

const whyUsRevealTargets = Array.from(
  document.querySelectorAll(".why-us__intro, .why-us__item"),
);

if (
  whyUsRevealTargets.length > 0 &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  whyUsRevealTargets.forEach((element, index) => {
    element.classList.add("stagger-reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index * 90, 420)}ms`);
  });

  const whyUsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  whyUsRevealTargets.forEach((element) => {
    whyUsObserver.observe(element);
  });
}

if (!document.querySelector(".whatsapp-float")) {
  const whatsappLink = document.createElement("a");
  whatsappLink.className = "whatsapp-float";
  whatsappLink.href = "https://wa.me/+41762726623";
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener noreferrer";
  whatsappLink.setAttribute("aria-label", "WhatsApp ile iletisime gec");

  const whatsappIcon = document.createElement("img");
  whatsappIcon.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2062095_application_chat_communication_logo_whatsapp_icon.svg/3840px-2062095_application_chat_communication_logo_whatsapp_icon.svg.png";
  whatsappIcon.alt = "";
  whatsappIcon.loading = "lazy";

  whatsappLink.appendChild(whatsappIcon);
  document.body.appendChild(whatsappLink);
}
