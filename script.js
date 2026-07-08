document.documentElement.classList.add('js');
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const mobileNavLabels = [
  ['./index.html#accueil', 'Accueil'],
  ['./club.html', 'Le Club'],
  ['./equipes.html', 'Les Équipes'],
  ['./calendrier.html', 'Calendrier'],
  ['./matchs.html', 'Calendrier'],
  ['./senior.html', 'Les Équipes'],
  ['./ecole.html', 'Les Équipes'],
  ['./jeunes.html', 'Les Équipes'],
  ['./cadettes.html', 'Les Équipes'],
  ['./actualites.html', 'Actualités'],
  ['./galerie.html', 'Galerie'],
  ['./histoire.html', 'Le Club'],
  ['./partenaires.html', 'Partenaires'],
  ['./boutique.html', 'Boutique'],
  ['./nous-rejoindre.html', 'Contact'],
  ['./notifications.html', 'Notifications'],
  ['/cms-login', 'Administration']
];

if (nav) {
  if (!nav.querySelector('.mobile-home-link') && !nav.querySelector('a[href="./index.html#accueil"]')) {
    const home = document.createElement('a');
    home.className = 'mobile-home-link';
    home.href = './index.html#accueil';
    home.textContent = 'Accueil';
    home.dataset.mobileLabel = 'Accueil';
    nav.prepend(home);
  }

  nav.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const match = mobileNavLabels.find(([target]) => href === target || href.endsWith(target.replace('./', '')));
    if (match) link.dataset.mobileLabel = match[1];
    if (link.classList.contains('nav-cta')) link.dataset.mobileLabel = 'Contact';
  });
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const activeGroups = {
    'index.html': 'index.html',
    'club.html': 'club.html',
    'histoire.html': 'club.html',
    'rcc-demain.html': 'club.html',
    'equipes.html': 'equipes.html',
    'senior.html': 'equipes.html',
    'ecole.html': 'equipes.html',
    'jeunes.html': 'equipes.html',
    'cadettes.html': 'equipes.html',
    'feminines.html': 'equipes.html',
    'calendrier.html': 'calendrier.html',
    'matchs.html': 'calendrier.html',
    'actualites.html': 'actualites.html',
    'galerie.html': 'galerie.html',
    'partenaires.html': 'partenaires.html',
    'boutique.html': 'boutique.html',
    'notifications.html': 'notifications.html',
    'nous-rejoindre.html': 'nous-rejoindre.html',
    'contact.html': 'nous-rejoindre.html'
  };
  const activeTarget = activeGroups[currentPage] || currentPage;
  nav.querySelectorAll('a').forEach((link) => {
    const href = (link.getAttribute('href') || '').split('#')[0].replace('./', '').toLowerCase();
    link.classList.toggle('is-active', href === activeTarget || (!href && activeTarget === 'index.html'));
  });
}
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
  const body = mailBody(['Nom : ' + name, 'Email : ' + email, phone ? 'TÃ©lÃ©phone : ' + phone : '', '', String(message)].filter(Boolean));
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.update())
      .catch(() => {});
  });
}

let deferredInstallPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

function createInstallButton() {
  if (isStandalone || document.querySelector('[data-install-app]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'install-app-button';
  button.dataset.installApp = '';
  button.textContent = "Installer l'application RCC";
  button.hidden = true;
  document.body.appendChild(button);

  button.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    button.hidden = true;
  });
}

createInstallButton();

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const button = document.querySelector('[data-install-app]');
  if (button && window.matchMedia('(max-width: 900px)').matches) {
    button.hidden = false;
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const button = document.querySelector('[data-install-app]');
  if (button) button.hidden = true;
});
// Chargement Google Analytics
const analytics = document.createElement("script");
analytics.src = "analytics.js";
document.body.appendChild(analytics);
