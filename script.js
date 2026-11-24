(() => {
  const stage = document.querySelector('.ring-stage');
  const orbit = document.getElementById('orbit');
  const indicator = document.getElementById('page-indicator');
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  if (!stage || !orbit || !indicator || !prev || !next) return;

  // These symbols are illustrative; ManaRing supports user-selected icon images.
  const pages = [
    ['🎨', '📁', '🎵', '🖼️', '✎', '🎮', '🌐', '📷'],
    ['📚', '📝', '🧮', '📅', '📊', '✉️'],
    ['🎬', '🎧', '🕹️', '📺', '🎹']
  ];
  const selections = pages.map(() => 0);
  const radius = 123;
  const spreadRadius = 205;
  const spreadAngle = 65;
  const duration = 380;
  const easing = 'cubic-bezier(.35, 0, .2, 1)';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let page = 0;
  let rightHeld = false;
  let animating = false;

  function position(index, count, selected, distance, offset = 0) {
    const angle = (index - selected) * 360 / count - 90 + offset;
    return `rotate(${angle}deg) translateX(${distance}px) rotate(${-angle}deg)`;
  }

  function makeIcons() {
    const icons = pages[page];
    const selected = selections[page];
    orbit.replaceChildren();
    orbit.style.transform = 'none';
    icons.forEach((symbol, index) => {
      const icon = document.createElement('div');
      icon.className = 'ring-icon' + (index === selected ? ' is-selected' : '');
      icon.style.transform = position(index, icons.length, selected, radius);
      const span = document.createElement('span');
      span.textContent = symbol;
      icon.appendChild(span);
      icon.title = 'クリックして選択';
      icon.addEventListener('click', () => selectIcon(index));
      orbit.appendChild(icon);
    });
    indicator.textContent = `ページ ${page + 1} / ${pages.length}`;
  }

  function selectIcon(index) {
    if (animating || index === selections[page]) return;
    selections[page] = index;
    makeIcons();
  }

  async function changePage(direction) {
    if (animating) return;
    animating = true;
    prev.disabled = true;
    next.disabled = true;
    try {
      if (!reducedMotion.matches && orbit.animate) {
        const oldIcons = Array.from(orbit.querySelectorAll('.ring-icon'));
        const count = pages[page].length;
        const selected = selections[page];
        // Existing page spreads outward while rotating.
        await Promise.all(oldIcons.map((icon, index) => icon.animate([
          { transform: position(index, count, selected, radius), opacity: 1 },
          { transform: position(index, count, selected, spreadRadius, direction * spreadAngle), opacity: 0 }
        ], { duration, easing, fill: 'forwards' }).finished));
      }

      page = (page + direction + pages.length) % pages.length;
      makeIcons();

      if (!reducedMotion.matches && orbit.animate) {
        const newIcons = Array.from(orbit.querySelectorAll('.ring-icon'));
        const count = pages[page].length;
        const selected = selections[page];
        // The next page converges from outside in the opposite rotation direction.
        await Promise.all(newIcons.map((icon, index) => icon.animate([
          { transform: position(index, count, selected, spreadRadius, -direction * spreadAngle), opacity: 0 },
          { transform: position(index, count, selected, radius), opacity: 1 }
        ], { duration, easing, fill: 'none' }).finished));
      }
    } finally {
      animating = false;
      prev.disabled = false;
      next.disabled = false;
    }
  }

  stage.addEventListener('contextmenu', event => event.preventDefault());
  stage.addEventListener('pointerdown', event => { if (event.button === 2) rightHeld = true; });
  window.addEventListener('pointerup', event => { if (event.button === 2) rightHeld = false; });
  window.addEventListener('blur', () => { rightHeld = false; });
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    if (animating || event.deltaY === 0) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    if (rightHeld || (event.buttons & 2)) {
      changePage(direction);
    } else {
      selectIcon((selections[page] + direction + pages[page].length) % pages[page].length);
    }
  }, { passive: false });
  prev.addEventListener('click', () => changePage(-1));
  next.addEventListener('click', () => changePage(1));
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (!animating) selectIcon((selections[page] + (event.key === 'ArrowRight' ? 1 : -1) + pages[page].length) % pages[page].length);
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault();
      changePage(event.key === 'ArrowUp' ? -1 : 1);
    }
  });
  makeIcons();
})();
