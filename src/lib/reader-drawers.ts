type Side = 'left' | 'right';
const breakpoints = { left: 760, right: 1200 };
const storageKey = 'wiki-reader-drawer-preferences';
const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select, summary, [tabindex="0"]';

export function initializeReaderDrawers(root: HTMLElement) {
  const shell = root.querySelector<HTMLElement>('[data-reader-shell]');
  const header = root.querySelector<HTMLElement>('.utility-header');
  const pane = root.querySelector<HTMLElement>('.reading-pane');
  const backdrop = root.querySelector<HTMLButtonElement>('[data-drawer-backdrop]');
  const drawers = { left: root.querySelector<HTMLElement>('[data-left-drawer]'), right: root.querySelector<HTMLElement>('[data-right-drawer]') };
  let modalSide: Side | null = null;
  const compact = (side: Side) => window.innerWidth <= breakpoints[side];
  const preferenceName = (side: Side) => `${side}${compact(side) ? 'Mobile' : 'Desktop'}`;
  function readPreference(side: Side): boolean {
    // Compact drawers start closed so opening a document always shows its content.
    if (compact(side)) return false;
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{}')[preferenceName(side)] ?? true; }
    catch { return true; }
  }
  function savePreference(side: Side, open: boolean) {
    try {
      const preferences = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
      localStorage.setItem(storageKey, JSON.stringify({ ...preferences, [preferenceName(side)]: open }));
    } catch { /* Navigation remains available without storage. */ }
  }
  function synchronize() {
    if (header) header.inert = Boolean(modalSide);
    if (pane) pane.inert = Boolean(modalSide);
    if (backdrop) backdrop.hidden = !modalSide;
    document.body.classList.toggle('has-reader-modal', Boolean(modalSide));
    for (const side of ['left', 'right'] as const) {
      const drawer = drawers[side];
      if (!drawer) continue;
      const open = drawer.classList.contains('is-open');
      drawer.inert = !open || Boolean(modalSide && modalSide !== side);
      drawer.setAttribute('aria-hidden', String(drawer.inert));
      drawer.classList.toggle('is-modal', modalSide === side);
      if (modalSide === side) {
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', side === 'left' ? '本书目录' : '本节索引');
      } else {
        drawer.removeAttribute('role'); drawer.removeAttribute('aria-modal'); drawer.removeAttribute('aria-label');
      }
      shell?.toggleAttribute(`data-${side}-open`, open);
      root.querySelectorAll(`[data-toggle-${side}]`).forEach((button) => button.setAttribute('aria-expanded', String(open)));
    }
  }
  function setOpen(side: Side, open: boolean, focus = false) {
    const drawer = drawers[side];
    if (!drawer) return;
    if (open && compact(side)) {
      if (modalSide && modalSide !== side) drawers[modalSide]?.classList.remove('is-open');
      modalSide = side;
    } else if (modalSide === side) modalSide = null;
    const returnFocus = !open && drawer.contains(document.activeElement);
    drawer.classList.toggle('is-open', open);
    synchronize();
    if (open && focus && compact(side)) drawer.querySelector<HTMLElement>('button')?.focus();
    else if (returnFocus || (!open && focus)) header?.querySelector<HTMLElement>(`[data-toggle-${side}]`)?.focus();
    if (open && side === 'left') {
      const current = drawer.querySelector<HTMLElement>('[data-current="true"]');
      const nav = drawer.querySelector<HTMLElement>('.chapter-nav');
      if (current && nav) nav.scrollTop += current.getBoundingClientRect().top - nav.getBoundingClientRect().top - (nav.clientHeight - current.clientHeight) / 2;
    }
  }
  function closeModal() { if (modalSide) setOpen(modalSide, false, true); }
  for (const side of ['left', 'right'] as const) {
    root.querySelectorAll(`[data-toggle-${side}]`).forEach((button) => button.addEventListener('click', () => {
      const open = !drawers[side]?.classList.contains('is-open');
      setOpen(side, open, true); savePreference(side, open);
    }));
    setOpen(side, readPreference(side));
  }
  backdrop?.addEventListener('click', closeModal);
  drawers.right?.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (!modalSide) return;
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab') return;
    const items = [...(drawers[modalSide]?.querySelectorAll<HTMLElement>(focusable) ?? [])].filter((item) => item.getClientRects().length > 0);
    const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  let modes = `${compact('left')}:${compact('right')}`;
  window.addEventListener('resize', () => {
    const nextModes = `${compact('left')}:${compact('right')}`;
    if (modes === nextModes) return;
    modes = nextModes; closeModal();
    for (const side of ['left', 'right'] as const) setOpen(side, readPreference(side));
  });
  return { closeModal };
}
