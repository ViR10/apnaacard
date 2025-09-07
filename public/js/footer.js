document.addEventListener('DOMContentLoaded', () => {
  // Footer accordions on mobile (<=768px)
  const mobile = window.matchMedia('(max-width: 768px)');
  function initAccordions() {
    document.querySelectorAll('.site-footer.footer--full .footer-section[data-collapsible]').forEach(section => {
      const btn = section.querySelector('.footer-toggle');
      const list = section.querySelector('.footer-list');
      if (!btn || !list) return;
      const expanded = false;
      section.setAttribute('data-expanded', expanded);
      btn.setAttribute('aria-expanded', String(expanded));
      btn.addEventListener('click', () => {
        const isOpen = section.getAttribute('data-expanded') === 'true';
        section.setAttribute('data-expanded', String(!isOpen));
        btn.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }
  if (mobile.matches) initAccordions();
  mobile.addEventListener('change', e => { if (e.matches) initAccordions(); });

  // Newsletter (client-side only)
  const form = document.getElementById('footerNewsletter');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = /** @type {HTMLInputElement} */(form.querySelector('input[type=email]'));
      const msg = document.getElementById('newsletterMsg');
      if (!email || !msg) return;
      const value = email.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!valid) {
        msg.textContent = 'Please enter a valid email address.';
        msg.style.color = '#fca5a5';
        email.focus();
        return;
      }
      // Simulate success
      msg.textContent = 'Thanks! You\'re subscribed.';
      msg.style.color = '#86efac';
      email.value = '';
    });
  }
});

