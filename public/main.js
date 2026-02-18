// ============================================================
// STOCKS MASTERCLASS — main.js
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// ── Countdown Timer ──────────────────────────────────────────
(function initCountdown() {
    const target = new Date('2026-03-04T10:00:00+00:00').getTime();

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
            document.getElementById('cd-days').textContent = '00';
            document.getElementById('cd-hours').textContent = '00';
            document.getElementById('cd-mins').textContent = '00';
            document.getElementById('cd-secs').textContent = '00';
            return;
        }

        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        document.getElementById('cd-days').textContent = pad(days);
        document.getElementById('cd-hours').textContent = pad(hours);
        document.getElementById('cd-mins').textContent = pad(mins);
        document.getElementById('cd-secs').textContent = pad(secs);
    }

    tick();
    setInterval(tick, 1000);
})();


// ── Sticky Nav ───────────────────────────────────────────────
(function initNav() {
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
})();


// ── Mobile Nav ───────────────────────────────────────────────
function closeMobileNav() {
    const mobile = document.getElementById('navMobile');
    if (mobile) {
        mobile.classList.remove('open');
        document.body.style.overflow = '';
    }
}

(function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const mobile = document.getElementById('navMobile');
    if (toggle && mobile) {
        toggle.addEventListener('click', () => {
            mobile.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }
    // Close on backdrop click (clicking outside the links)
    if (mobile) {
        mobile.addEventListener('click', function (e) {
            if (e.target === mobile) closeMobileNav();
        });
    }
})();








// ── Floating Market Widget ───────────────────────────────────
(function initMarketWidget() {
    const stocks = [
        { s: 'AAPL', c: +1.24 },
        { s: 'TSLA', c: -0.85 },
        { s: 'NVDA', c: +3.42 },
        { s: 'BTC', c: +1.15 },
        { s: 'GOLD', c: -0.22 }
    ];
    let index = 0;
    const content = document.getElementById('marketWidgetContent');
    if (!content) return;

    function update() {
        const s = stocks[index];
        const up = s.c >= 0;
        content.innerHTML = `<div class="widget-ticker">${s.s} <span class="${up ? 'up' : 'down'}">${up ? '+' : ''}${s.c}%</span></div>`;
        index = (index + 1) % stocks.length;

        // Slight randomization
        s.c = +(s.c + (Math.random() - 0.5) * 0.5).toFixed(2);
    }

    update();
    setInterval(update, 3000);
})();

// ── FAQ Accordion ────────────────────────────────────────────
(function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

            // Toggle clicked
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            } else {
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    });
})();



// ── Scroll Animations ────────────────────────────────────────
(function initScrollAnimations() {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
})();


// ── Modal ────────────────────────────────────────────────────
function openModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('su-name').focus();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});


// ── Sign-up Form (Modal) ─────────────────────────────────────
(function initSignupForm() {
    const form = document.getElementById('signupForm');
    const success = document.getElementById('su-success');
    const submit = document.getElementById('su-submit');

    // Flutterwave payment link — replace with your actual link
    const PAYMENT_LINK = 'https://flutterwave.com/pay/your-payment-link';

    function showFieldError(inputId, errorId, show) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        input.classList.toggle('error', show);
        error.style.display = show ? 'block' : 'none';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('su-name').value.trim();
        const email = document.getElementById('su-email').value.trim();
        const phone = document.getElementById('su-phone').value.trim();

        let valid = true;

        if (!name) {
            showFieldError('su-name', 'su-name-error', true);
            valid = false;
        } else {
            showFieldError('su-name', 'su-name-error', false);
        }

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) {
            showFieldError('su-email', 'su-email-error', true);
            valid = false;
        } else {
            showFieldError('su-email', 'su-email-error', false);
        }

        if (!valid) return;

        submit.disabled = true;
        submit.textContent = 'Saving...';

        try {
            const res = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone })
            });
            const data = await res.json();

            if (res.ok || res.status === 409) {
                // 409 = already registered, still redirect to payment
                success.style.display = 'block';
                setTimeout(() => {
                    window.open(PAYMENT_LINK, '_blank');
                    closeModal();
                    success.style.display = 'none';
                    form.reset();
                    submit.disabled = false;
                    submit.innerHTML = 'Continue to Payment <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
                }, 1800);
            } else {
                alert(data.message || 'Something went wrong. Please try again.');
                submit.disabled = false;
                submit.innerHTML = 'Continue to Payment <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
            }
        } catch {
            alert('Could not connect to the server. Please try again.');
            submit.disabled = false;
            submit.innerHTML = 'Continue to Payment <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        }
    });
})();


// ── Newsletter Form ───────────────────────────────────────────
(function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const success = document.getElementById('nl-success');
    const error = document.getElementById('nl-error');
    const emailEl = document.getElementById('nl-email');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('nl-name').value.trim();
        const email = emailEl.value.trim();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailOk) {
            emailEl.classList.add('error');
            error.style.display = 'block';
            return;
        }

        emailEl.classList.remove('error');
        error.style.display = 'none';

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Subscribing...';

        try {
            const res = await fetch(`${API_BASE}/newsletter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            const data = await res.json();

            if (res.ok) {
                success.textContent = data.message;
                success.style.display = 'block';
                form.reset();
            } else if (res.status === 409) {
                success.textContent = 'You are already subscribed.';
                success.style.display = 'block';
            } else {
                error.textContent = data.message || 'Something went wrong.';
                error.style.display = 'block';
            }
        } catch {
            error.textContent = 'Could not connect. Please try again.';
            error.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Subscribe for Free';
        }
    });
})();
