/* ============================================================
   FLOT AUTO — interactions
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const pad = (n) => String(n).padStart(2, '0');

  document.body.classList.add('is-locked');

  /* ---------- preloader ---------- */
  const preloader = $('#preloader');
  const preloaderBar = $('#preloaderBar');
  const preloaderCount = $('#preloaderCount');

  function finishLoading() {
    document.body.classList.add('is-loaded');
    document.body.classList.remove('is-locked');
    if (preloader) {
      preloader.classList.add('is-done');
      window.setTimeout(() => preloader.remove(), 1100);
    }
  }

  function runPreloader() {
    if (!preloader) { finishLoading(); return; }
    if (reduced.matches) {
      preloaderCount.textContent = '100';
      preloaderBar.style.width = '100%';
      window.setTimeout(finishLoading, 150);
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const value = Math.round(eased * 100);
      preloaderCount.textContent = pad(value);
      preloaderBar.style.width = `${value}%`;
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        window.setTimeout(finishLoading, 220);
      }
    };
    requestAnimationFrame(tick);
  }
  runPreloader();

  /* ---------- header ---------- */
  const header = $('#header');
  let lastScroll = window.scrollY;
  let scrollTicking = false;

  function updateHeader() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    const menuOpen = $('#menu')?.classList.contains('is-open');
    if (!menuOpen) {
      if (y > lastScroll && y > 560) header.classList.add('is-hidden');
      else header.classList.remove('is-hidden');
    }
    lastScroll = y;
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateHeader); }
  }, { passive: true });
  updateHeader();

  /* ---------- mobile menu ---------- */
  const menu = $('#menu');
  const burger = $('#burger');
  const menuClose = $('#menuClose');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);
    if (open) header.classList.remove('is-hidden');
    if (open) menuClose.focus({ preventScroll: true });
    else burger.focus({ preventScroll: true });
  }
  burger?.addEventListener('click', () => setMenu(!menuOpen));
  menuClose?.addEventListener('click', () => setMenu(false));
  $$('.menu__nav a, .menu__contacts a, .menu__socials a').forEach((link) => {
    link.addEventListener('click', () => {
      menuOpen = false;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1120 && menuOpen) setMenu(false);
  });

  /* ---------- hero video ---------- */
  const heroVideo = $('#heroVideo');
  if (heroVideo) {
    const play = () => {
      if (reduced.matches) { heroVideo.pause(); return; }
      const promise = heroVideo.play();
      if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) play();
          else heroVideo.pause();
        });
      }, { threshold: 0.05 }).observe($('.hero'));
    } else {
      play();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) heroVideo.pause();
      else if (!reduced.matches) play();
    });
  }

  /* ---------- reveal ---------- */
  const revealEls = $$('.reveal, .reveal-lines');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-inview'));
  }

  /* ---------- animated counters ---------- */
  const counters = $$('[data-count]');
  const formatNumber = (value) => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  function animateCounter(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduced.matches) { el.textContent = formatNumber(target) + suffix; return; }
    const duration = 1700;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNumber(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target) + suffix;
    };
    requestAnimationFrame(tick);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach((el) => counterObserver.observe(el));
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------- showroom ---------- */
  const stage = $('#showroomStage');
  if (stage) {
    const stageImages = $$('.stage__img', stage);
    const stageTabs = $$('.stage__tab', stage);
    const viewIndex = $('#stageViewIndex');
    const viewName = $('#stageViewName');
    const viewData = {
      side: { index: '01', name: 'Боковой профиль' },
      detail: { index: '02', name: 'Колесо и карбон' },
      rear: { index: '03', name: 'Вид сзади' }
    };
    const setView = (view) => {
      stageImages.forEach((img) => img.classList.toggle('is-active', img.dataset.view === view));
      stageTabs.forEach((tab) => {
        const active = tab.dataset.view === view;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
      });
      if (viewData[view]) {
        viewIndex.textContent = viewData[view].index;
        viewName.textContent = viewData[view].name;
      }
    };
    stageTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => setView(tab.dataset.view));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = stageTabs[(i + dir + stageTabs.length) % stageTabs.length];
        next.focus();
        setView(next.dataset.view);
      });
    });

    const finishName = $('#finishName');
    const swatches = $$('.finish__swatch', stage.parentElement);
    swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        swatches.forEach((s) => {
          s.classList.toggle('is-active', s === swatch);
          s.setAttribute('aria-checked', String(s === swatch));
        });
        stage.style.setProperty('--stage-brightness', swatch.dataset.brightness || '1');
        stage.style.setProperty('--stage-bg', swatch.dataset.bg || '#ffffff');
        if (finishName) finishName.textContent = swatch.dataset.finish || '';
      });
    });
  }

  /* ---------- fleet filtering ---------- */
  const filters = $$('.filter');
  const fleetCards = $$('.fleet-card');
  const fleetResult = $('#fleetResult');
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filters.forEach((b) => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      let visible = 0;
      fleetCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.classList.remove('is-entering');
        if (match) {
          card.classList.remove('is-hidden');
          void card.offsetWidth;
          card.style.setProperty('--enter-delay', `${visible * 55}ms`);
          card.classList.add('is-entering');
          visible += 1;
        } else {
          card.classList.add('is-hidden');
        }
      });
      if (fleetResult) fleetResult.textContent = `Показано ${pad(visible)} из ${pad(fleetCards.length)}`;
    });
  });
  fleetCards.forEach((card) => {
    card.addEventListener('animationend', () => card.classList.remove('is-entering'));
  });

  /* ---------- car modal ---------- */
  const modal = $('#carModal');
  if (modal && typeof modal.showModal === 'function') {
    const fields = {
      cat: $('#carModalCat'),
      img: $('#carModalImg'),
      year: $('#carModalYear'),
      title: $('#carModalTitle'),
      desc: $('#carModalDesc'),
      engine: $('#carModalEngine'),
      power: $('#carModalPower'),
      accel: $('#carModalAccel'),
      top: $('#carModalTop'),
      mileage: $('#carModalMileage'),
      yearSpec: $('#carModalYearSpec'),
      price: $('#carModalPrice')
    };
    let activeCar = '';
    const openModal = (card) => {
      const d = card.dataset;
      activeCar = d.name || '';
      fields.cat.textContent = d.catLabel || '';
      fields.img.src = d.img || '';
      fields.img.alt = `${d.name} — фотография автомобиля`;
      fields.img.classList.toggle('is-flip', d.flip === 'true');
      fields.year.textContent = `${d.year} / В наличии`;
      fields.title.textContent = d.name || '';
      fields.desc.textContent = d.desc || '';
      fields.engine.textContent = d.engine || '';
      fields.power.textContent = d.power || '';
      fields.accel.textContent = d.accel || '';
      fields.top.textContent = d.top || '';
      fields.mileage.textContent = d.mileage || '';
      fields.yearSpec.textContent = d.year || '';
      fields.price.textContent = d.price || '';
      modal.showModal();
      document.body.classList.add('is-locked');
    };
    $$('.fleet-card__hit').forEach((hit) => {
      hit.addEventListener('click', () => {
        const card = hit.closest('.fleet-card');
        if (card) openModal(card);
      });
    });
    const closeModal = () => modal.close();
    $('#carModalClose')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });
    modal.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
    });
    $('#carModalBook')?.addEventListener('click', () => {
      modal.close();
      requestAnimationFrame(() => bookCar(activeCar));
    });
  }

  /* ---------- shared booking helper ---------- */
  function bookCar(name) {
    const select = $('#model');
    if (select && name) {
      const option = Array.from(select.options).find((o) => o.textContent.trim() === name);
      if (option) select.value = option.value;
    }
    const form = $('#contactForm');
    const section = $('#contacts');
    section?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    if (form) {
      form.classList.remove('is-highlight');
      void form.offsetWidth;
      form.classList.add('is-highlight');
      window.setTimeout(() => form.classList.remove('is-highlight'), 1300);
    }
    window.setTimeout(() => $('#name')?.focus({ preventScroll: true }), reduced.matches ? 50 : 700);
  }
  $$('[data-book]').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.dataset.book;
      window.setTimeout(() => {
        const select = $('#model');
        if (select && name) {
          const option = Array.from(select.options).find((o) => o.textContent.trim() === name);
          if (option) select.value = option.value;
        }
      }, 400);
    });
  });
  $('.panel__link')?.addEventListener('click', () => {
    window.setTimeout(() => {
      const select = $('#model');
      if (select) select.value = 'FLOT ONE';
    }, 400);
  });

  /* ---------- floating service preview ---------- */
  const servicePreview = $('#servicePreview');
  if (servicePreview && finePointer.matches) {
    const previewImg = $('img', servicePreview);
    const previewLabel = $('#servicePreviewLabel');
    const rows = $$('.service-row');
    const movePreview = (e) => {
      const offset = 190;
      let x = e.clientX + offset;
      if (x + 145 > window.innerWidth - 12) x = e.clientX - offset;
      const y = clamp(e.clientY, 135, window.innerHeight - 135);
      servicePreview.style.left = `${x}px`;
      servicePreview.style.top = `${y}px`;
    };
    rows.forEach((row) => {
      row.addEventListener('mouseenter', (e) => {
        previewImg.src = row.dataset.preview || 'assets/car-side.jpg';
        previewLabel.textContent = row.dataset.previewLabel || '';
        servicePreview.classList.add('is-visible');
        movePreview(e);
      });
      row.addEventListener('mousemove', movePreview);
      row.addEventListener('mouseleave', () => servicePreview.classList.remove('is-visible'));
    });
    document.addEventListener('scroll', () => servicePreview.classList.remove('is-visible'), { passive: true });
  }

  /* ---------- testimonials ---------- */
  const quotes = $('#quotes');
  if (quotes) {
    const slides = $$('.quote-slide', quotes);
    const currentEl = $('#quoteCurrent');
    const progressEl = $('#quoteProgress');
    const prevBtn = $('#quotePrev');
    const nextBtn = $('#quoteNext');
    let index = 0;
    let autoTimer = null;

    const render = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      if (currentEl) currentEl.textContent = pad(index + 1);
      if (progressEl) progressEl.style.width = `${((index + 1) / slides.length) * 100}%`;
    };
    const next = () => render(index + 1);
    const prev = () => render(index - 1);
    const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
    const startAuto = () => {
      stopAuto();
      if (reduced.matches || slides.length < 2) return;
      autoTimer = window.setInterval(next, 7500);
    };

    nextBtn?.addEventListener('click', () => { next(); startAuto(); });
    prevBtn?.addEventListener('click', () => { prev(); startAuto(); });
    quotes.addEventListener('mouseenter', stopAuto);
    quotes.addEventListener('mouseleave', startAuto);
    quotes.addEventListener('focusin', stopAuto);
    quotes.addEventListener('focusout', (e) => {
      if (!quotes.contains(e.relatedTarget)) startAuto();
    });

    let swipeX = null;
    quotes.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      swipeX = e.clientX;
    });
    quotes.addEventListener('pointerup', (e) => {
      if (swipeX === null) return;
      const delta = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(delta) < 42) return;
      if (delta < 0) next(); else prev();
      startAuto();
    });

    render(0);
    startAuto();
  }

  /* ---------- contact form ---------- */
  const form = $('#contactForm');
  if (form) {
    const nameInput = $('#name');
    const phoneInput = $('#phone');
    const consent = $('#consent');
    const checkWrap = consent?.closest('.check');
    const formSuccess = $('#formSuccess');
    const successName = $('#successName');
    const resetBtn = $('#formReset');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn?.querySelector('.btn__label');
    const consentError = $('[data-error-for="consent"]');

    const fieldError = (key) => $(`[data-error-for="${key}"]`);
    const setError = (key, message) => {
      const errorEl = fieldError(key);
      if (key === 'consent') {
        checkWrap?.classList.add('is-invalid');
        consentError?.classList.add('is-visible');
        if (errorEl) errorEl.textContent = message;
        return;
      }
      const input = key === 'name' ? nameInput : phoneInput;
      input?.closest('.field')?.classList.add('is-invalid');
      if (errorEl) errorEl.textContent = message;
    };
    const clearError = (key) => {
      const errorEl = fieldError(key);
      if (key === 'consent') {
        checkWrap?.classList.remove('is-invalid');
        consentError?.classList.remove('is-visible');
        if (errorEl) errorEl.textContent = '';
        return;
      }
      const input = key === 'name' ? nameInput : phoneInput;
      input?.closest('.field')?.classList.remove('is-invalid');
      if (errorEl) errorEl.textContent = '';
    };
    const clearAll = () => ['name', 'phone', 'consent'].forEach(clearError);

    const formatPhone = (value) => {
      let digits = value.replace(/\D/g, '');
      if (!digits) return '';
      if (digits[0] === '8') digits = `7${digits.slice(1)}`;
      if (digits[0] !== '7') digits = `7${digits}`;
      if (digits[1] === '8') digits = `7${digits.slice(2)}`;
      digits = digits.slice(0, 11);
      let out = '+7';
      if (digits.length > 1) out += ` (${digits.slice(1, 4)}`;
      if (digits.length >= 5) out += `) ${digits.slice(4, 7)}`;
      if (digits.length >= 8) out += `-${digits.slice(7, 9)}`;
      if (digits.length >= 10) out += `-${digits.slice(9, 11)}`;
      return out;
    };
    const phoneDigits = () => (phoneInput?.value || '').replace(/\D/g, '');

    phoneInput?.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) phoneInput.value = '+7 ';
    });
    phoneInput?.addEventListener('input', () => {
      phoneInput.value = formatPhone(phoneInput.value);
      if (phoneInput.value === '+7 ') phoneInput.value = '+7 ';
      clearError('phone');
    });
    phoneInput?.addEventListener('blur', () => {
      if (phoneDigits().length <= 1) phoneInput.value = '';
    });
    nameInput?.addEventListener('input', () => clearError('name'));
    consent?.addEventListener('change', () => clearError('consent'));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAll();
      let firstInvalid = null;
      if (!nameInput || nameInput.value.trim().length < 2) {
        setError('name', 'Укажите имя — минимум 2 символа');
        firstInvalid = firstInvalid || nameInput;
      }
      if (phoneDigits().length !== 11) {
        setError('phone', 'Введите номер полностью');
        firstInvalid = firstInvalid || phoneInput;
      }
      if (!consent?.checked) {
        setError('consent', 'Нужно согласие на обработку данных');
        firstInvalid = firstInvalid || consent;
      }
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
        return;
      }

      if (submitLabel) submitLabel.textContent = 'Отправляем…';
      if (submitBtn) submitBtn.disabled = true;
      window.setTimeout(() => {
        if (submitLabel) submitLabel.textContent = 'Отправить заявку';
        if (submitBtn) submitBtn.disabled = false;
        if (successName) successName.textContent = nameInput.value.trim();
        form.classList.add('is-success');
        formSuccess?.setAttribute('aria-hidden', 'false');
        resetBtn?.focus({ preventScroll: true });
      }, reduced.matches ? 100 : 900);
    });

    resetBtn?.addEventListener('click', () => {
      form.classList.remove('is-success');
      formSuccess?.setAttribute('aria-hidden', 'true');
      form.reset();
      clearAll();
      if (phoneInput) phoneInput.value = '';
      nameInput?.focus();
    });
  }

  /* ---------- custom cursor ---------- */
  if (finePointer.matches) {
    const cursor = $('#cursor');
    const dot = $('#cursorDot');
    const labelEl = cursor?.querySelector('.cursor__label');
    if (cursor && dot && labelEl) {
      document.body.classList.add('has-cursor');
      cursor.style.opacity = '0';
      dot.style.opacity = '0';
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let ringX = mouseX;
      let ringY = mouseY;

      const loop = () => {
        ringX += (mouseX - ringX) * 0.16;
        ringY += (mouseY - ringY) * 0.16;
        cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.opacity = '';
        dot.style.opacity = '';
      });
      document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        dot.style.opacity = '0';
      });
      document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
      document.addEventListener('mouseup', () => cursor.classList.remove('is-down'));

      const bindTargets = () => {
        $$('a, button, [role="button"], input, select, .check').forEach((el) => {
          el.addEventListener('mouseenter', () => {
            cursor.classList.add('is-hover');
            const card = el.closest('.fleet-card');
            const label = el.dataset.cursorLabel || (card ? 'Открыть' : '');
            if (label) {
              labelEl.textContent = label;
              cursor.classList.add('has-label');
            }
          });
          el.addEventListener('mouseleave', () => {
            cursor.classList.remove('is-hover', 'has-label');
            labelEl.textContent = '';
          });
        });
      };
      bindTargets();
    }
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer.matches && !reduced.matches) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = clamp((e.clientX - rect.left - rect.width / 2) * 0.16, -7, 7);
        const y = clamp((e.clientY - rect.top - rect.height / 2) * 0.16, -5, 5);
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- parallax ---------- */
  const parallaxEls = $$('[data-parallax]');
  if (parallaxEls.length && !reduced.matches) {
    let ticking = false;
    const updateParallax = () => {
      parallaxEls.forEach((el) => {
        const wrap = el.parentElement;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
        const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        const shift = clamp(progress * 74, -48, 48);
        el.style.transform = `translate3d(0, ${shift}px, 0) scale(1.12)`;
      });
      ticking = false;
    };
    const requestParallax = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateParallax);
    };
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    updateParallax();
  }

  /* ---------- year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
