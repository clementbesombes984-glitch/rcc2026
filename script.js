document.documentElement.classList.add('js');
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function mailBody(lines) {
  return lines.join('\n');
}

function buildMailto(form) {
  const data = new FormData(form);
  const name = data.get('name') || '';
  const email = data.get('email') || '';
  const subject = data.get('subject') || 'Contact depuis le site RCC';
  const phone = data.get('phone') || '';
  const message = data.get('message') || '';
  const target = document.querySelector('[data-cms="email"]')?.textContent?.trim() || 'lerccdemain@gmail.com';
  const body = mailBody(['Nom : ' + name, 'Email : ' + email, phone ? 'Téléphone : ' + phone : '', '', String(message)].filter(Boolean));
  return 'mailto:' + encodeURIComponent(target) + '?subject=' + encodeURIComponent(String(subject)) + '&body=' + encodeURIComponent(body);
}

document.querySelectorAll('.join-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.matches('[data-contact-form]')) {
      window.location.href = buildMailto(form);
      return;
    }
    const data = new FormData(form);
    const target = document.querySelector('[data-cms="email"]')?.textContent?.trim() || 'lerccdemain@gmail.com';
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const message = data.get('message') || '';
    const body = mailBody(['Nom : ' + name, 'Email : ' + email, '', String(message)]);
    window.location.href = 'mailto:' + encodeURIComponent(target) + '?subject=' + encodeURIComponent('Nous rejoindre - RCC') + '&body=' + encodeURIComponent(body);
  });
});

const revealTargets = () => document.querySelectorAll('section, .card, .news-grid article, .match, .player-card, .staff-card, .partner-card, .project-card, .gallery-album, .countdown-card, .last-result-card');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px 80px 0px' });
  requestAnimationFrame(() => {
    revealTargets().forEach((node) => {
      node.setAttribute('data-reveal', '');
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96) {
        node.classList.add('is-visible');
      }
      observer.observe(node);
    });
  });
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((node) => node.classList.add('is-visible'));
  }, 900);
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heroArt = document.querySelector('.hero .hero-art');
  if (heroArt) {
    window.addEventListener('scroll', () => {
      const y = Math.min(28, window.scrollY * 0.035);
      heroArt.style.setProperty('--parallax-y', y + 'px');
    }, { passive: true });
  }
}
