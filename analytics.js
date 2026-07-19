// Google Analytics 4 - initialisation unique sur les pages publiques.
if (!window.__RCC_GA_INITIALIZED__) {
  window.__RCC_GA_INITIALIZED__ = true;
  const measurementId = 'G-BBHY7M33X4';
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}
