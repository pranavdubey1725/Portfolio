import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const ease = 'expo.out';

  // Hero: headline lines rise out of their masks, then the supporting copy fades in.
  const heroLines = gsap.utils.toArray<HTMLElement>('.hero__title .line > span');
  const heroFades = gsap.utils.toArray<HTMLElement>('.hero [data-fade]');
  gsap
    .timeline({ defaults: { ease }, onStart: () => root.classList.add('motion-ready') })
    // y is reset explicitly: GSAP otherwise reads the CSS pre-hide transform as a px offset.
    .fromTo(heroLines, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.1, stagger: 0.09 })
    .fromTo(heroFades, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, '-=0.7');

  // Hero: as it scrolls away, the middle and last lines drift apart slightly.
  gsap.utils.toArray<HTMLElement>('.hero__title [data-drift]').forEach((line) => {
    const dir = Number(line.dataset.drift);
    if (!dir) return;
    gsap.to(line, {
      xPercent: dir * 6,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
    });
  });

  // Section titles: masked rise when they enter the viewport.
  gsap.utils.toArray<HTMLElement>('[data-reveal] > span').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 105 },
      { yPercent: 0, duration: 1, ease, scrollTrigger: { trigger: el.parentElement, start: 'top 88%', once: true } },
    );
  });

  // Supporting blocks outside the hero: short fade-up.
  gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease, scrollTrigger: { trigger: el, start: 'top 92%', once: true } },
    );
  });

  // Project rows: slide in from the rule line.
  gsap.utils.toArray<HTMLElement>('.proj').forEach((row, i) => {
    gsap.fromTo(
      row.querySelector('.proj__toggle'),
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: i * 0.08,
        ease,
        scrollTrigger: { trigger: row, start: 'top 90%', once: true },
      },
    );
  });

  // Expanding a project changes page height; keep trigger positions correct.
  document.querySelectorAll('.proj__panel').forEach((panel) =>
    panel.addEventListener('transitionend', () => ScrollTrigger.refresh()),
  );
});

// Always reveal content, even if motion is off or something above throws.
root.classList.add('motion-ready');
