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
    const closeBtn = document.getElementById('navMobileClose');

    if (toggle && mobile) {
        toggle.addEventListener('click', () => {
            mobile.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileNav);
    }
    // Close on backdrop click (clicking outside the links)
    if (mobile) {
        mobile.addEventListener('click', function (e) {
            if (e.target === mobile) closeMobileNav();
        });
    }
})();


// ── Stock Ticker Strip ───────────────────────────────────────
(function initTicker() {
    const stocks = [
        { symbol: 'AAPL', name: 'Apple', price: 227.52, change: +1.34 },
        { symbol: 'TSLA', name: 'Tesla', price: 341.80, change: -2.18 },
        { symbol: 'NVDA', name: 'Nvidia', price: 875.40, change: +4.62 },
        { symbol: 'MSFT', name: 'Microsoft', price: 415.20, change: +0.87 },
        { symbol: 'AMZN', name: 'Amazon', price: 198.75, change: -0.54 },
        { symbol: 'META', name: 'Meta', price: 582.30, change: +3.21 },
        { symbol: 'GOOGL', name: 'Alphabet', price: 196.40, change: -1.05 },
        { symbol: 'SPY', name: 'S&P 500 ETF', price: 592.80, change: +0.43 },
        { symbol: 'GLD', name: 'Gold ETF', price: 238.60, change: +1.12 },
        { symbol: 'BRK.B', name: 'Berkshire', price: 468.90, change: +0.28 },
        { symbol: 'JPM', name: 'JPMorgan', price: 252.40, change: -0.76 },
        { symbol: 'V', name: 'Visa', price: 334.10, change: +0.91 },
    ];

    function buildItem(s) {
        const up = s.change >= 0;
        const pct = ((Math.abs(s.change) / s.price) * 100).toFixed(2);
        return `<div class="ticker-item">
            <span class="ticker-symbol">${s.symbol}</span>
            <span class="ticker-price">$${s.price.toFixed(2)}</span>
            <span class="ticker-change ${up ? 'up' : 'down'}">${up ? '+' : ''}${s.change.toFixed(2)}</span>
            <span class="ticker-arrow ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${pct}%</span>
        </div>`;
    }

    const items = document.getElementById('tickerItems');
    const clone = document.getElementById('tickerItemsClone');
    if (!items || !clone) return;

    const html = stocks.map(buildItem).join('');
    items.innerHTML = html;
    clone.innerHTML = html;   // duplicate for seamless loop

    // Simulate live price updates
    setInterval(() => {
        stocks.forEach(s => {
            const move = (Math.random() - 0.48) * 2;
            s.price = Math.max(1, s.price + move);
            s.change += move;
        });
        const newHtml = stocks.map(buildItem).join('');
        items.innerHTML = newHtml;
        clone.innerHTML = newHtml;
    }, 4000);
})();


// ── Hero Candlestick Chart ───────────────────────────────────
(function initCandleChart() {
    const group = document.getElementById('candleGroup');
    const priceLine = document.getElementById('priceLine');
    if (!group || !priceLine) return;

    const W = 320, H = 120;
    const candleCount = 20;
    const candleW = 10;
    const gap = (W - candleCount * candleW) / (candleCount + 1);

    // Generate initial candle data
    let price = 65;
    const candles = [];
    for (let i = 0; i < candleCount; i++) {
        const open = price;
        const close = open + (Math.random() - 0.46) * 8;
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        price = close;
        candles.push({ open, close, high, low });
    }

    function normalize(v, min, max) {
        return H - ((v - min) / (max - min)) * (H - 16) - 8;
    }

    function render() {
        const allPrices = candles.flatMap(c => [c.high, c.low]);
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);

        let svgHtml = '';
        const linePoints = [];

        candles.forEach((c, i) => {
            const x = gap + i * (candleW + gap) + candleW / 2;
            const openY = normalize(c.open, min, max);
            const closeY = normalize(c.close, min, max);
            const highY = normalize(c.high, min, max);
            const lowY = normalize(c.low, min, max);
            const up = c.close >= c.open;
            const color = up ? '#34c759' : '#e05252';
            const bodyTop = Math.min(openY, closeY);
            const bodyH = Math.max(Math.abs(closeY - openY), 1);

            svgHtml += `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="1" opacity="0.7"/>`;
            svgHtml += `<rect x="${x - candleW / 2}" y="${bodyTop}" width="${candleW}" height="${bodyH}" fill="${color}" rx="1" opacity="0.85"/>`;

            linePoints.push(`${x},${normalize(c.close, min, max)}`);
        });

        group.innerHTML = svgHtml;
        priceLine.setAttribute('points', linePoints.join(' '));
    }

    render();

    // Add new candle every 2s
    setInterval(() => {
        const last = candles[candles.length - 1];
        const open = last.close;
        const close = open + (Math.random() - 0.46) * 8;
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        candles.push({ open, close, high, low });
        if (candles.length > candleCount) candles.shift();
        render();
    }, 2000);
})();


// ── Market Pulse Cards ───────────────────────────────────────
(function initMarketPulse() {
    const grid = document.getElementById('pulseGrid');
    if (!grid) return;

    const stocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 227.52, change: +1.34, sector: 'Tech' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 341.80, change: -2.18, sector: 'EV' },
        { symbol: 'NVDA', name: 'Nvidia Corp.', price: 875.40, change: +4.62, sector: 'Chips' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.20, change: +0.87, sector: 'Tech' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 198.75, change: -0.54, sector: 'Retail' },
        { symbol: 'META', name: 'Meta Platforms', price: 582.30, change: +3.21, sector: 'Social' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 196.40, change: -1.05, sector: 'Ads' },
        { symbol: 'SPY', name: 'S&P 500 ETF', price: 592.80, change: +0.43, sector: 'Index' },
    ];

    // Generate sparkline history for each stock
    stocks.forEach(s => {
        const hist = [];
        let p = s.price * 0.96;
        for (let i = 0; i < 20; i++) {
            p += (Math.random() - 0.47) * (s.price * 0.01);
            hist.push(p);
        }
        hist.push(s.price);
        s.history = hist;
    });

    function sparklinePath(history, color) {
        const W = 200, H = 40;
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min || 1;
        const pts = history.map((v, i) => {
            const x = (i / (history.length - 1)) * W;
            const y = H - ((v - min) / range) * (H - 4) - 2;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        return `<svg class="pulse-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
            <defs>
                <linearGradient id="sg${color.replace('#', '')}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;
    }

    function renderCard(s) {
        const up = s.change >= 0;
        const pct = ((Math.abs(s.change) / s.price) * 100).toFixed(2);
        const color = up ? '#34c759' : '#e05252';
        const card = document.getElementById('pulse-' + s.symbol);
        const html = `
            <div class="pulse-card-top">
                <div>
                    <div class="pulse-symbol">${s.symbol}</div>
                    <div class="pulse-name">${s.name}</div>
                </div>
                <span class="pulse-badge ${up ? 'up' : 'down'}">${s.sector}</span>
            </div>
            <div class="pulse-price">$${s.price.toFixed(2)}</div>
            <div class="pulse-change ${up ? 'up' : 'down'}">${up ? '+' : ''}${s.change.toFixed(2)} (${up ? '+' : '-'}${pct}%)</div>
            ${sparklinePath(s.history, color)}
            <div class="pulse-updated"><div class="pulse-dot"></div> Live simulation</div>
        `;
        if (card) {
            card.innerHTML = html;
        } else {
            const div = document.createElement('div');
            div.className = 'pulse-card fade-up';
            div.id = 'pulse-' + s.symbol;
            div.innerHTML = html;
            grid.appendChild(div);
        }
    }

    stocks.forEach(renderCard);

    // Simulate live updates every 3s
    setInterval(() => {
        stocks.forEach(s => {
            const move = (Math.random() - 0.48) * (s.price * 0.008);
            s.price = Math.max(1, s.price + move);
            s.change += move;
            s.history.push(s.price);
            if (s.history.length > 21) s.history.shift();
            renderCard(s);
        });
    }, 3000);
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
