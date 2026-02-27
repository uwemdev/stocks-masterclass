/**
 * content-loader.js
 * Loads dynamic content from /api/content and updates the page
 * on every load — so admin edits reflect immediately.
 */
(function () {
    'use strict';

    async function loadContent() {
        let content;
        try {
            const res = await fetch('/api/content');
            const data = await res.json();
            if (!data.success) return;
            content = data.content;
        } catch { return; }

        // Helper: set text safely
        function setText(key, el) {
            if (!el || !(key in content) || !content[key]) return;
            el.textContent = content[key];
        }
        function setHTML(key, el) {
            if (!el || !(key in content) || !content[key]) return;
            el.innerHTML = content[key];
        }
        function setAttr(key, el, attr) {
            if (!el || !(key in content) || !content[key]) return;
            el.setAttribute(attr, content[key]);
        }

        // ── SEO ──────────────────────────────────────────────────────────────
        if (content.meta_title) document.title = content.meta_title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && content.meta_description) metaDesc.setAttribute('content', content.meta_description);
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && content.og_title) ogTitle.setAttribute('content', content.og_title);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && content.og_description) ogDesc.setAttribute('content', content.og_description);

        // ── THEME / COLORS ───────────────────────────────────────────────────
        if (content.primary_color || content.secondary_color) {
            const styleId = 'admin-theme-overrides';
            let styleEl = document.getElementById(styleId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }

            let cssVars = ':root {\n';
            if (content.primary_color) {
                cssVars += `  --blue: ${content.primary_color};\n`;
                cssVars += `  --blue-mid: ${content.primary_color};\n`;
                // Add a slightly dimmed version for borders/backgrounds using basic string concat
                cssVars += `  --blue-dim: ${content.primary_color}1a;\n`; // 10% opacity hex
                cssVars += `  --blue-border: ${content.primary_color}2e;\n`; // 18% opacity hex
                cssVars += `  --gold: ${content.primary_color};\n`; // Catch legacy values
            }
            if (content.secondary_color) {
                cssVars += `  --bg-hero: ${content.secondary_color};\n`;
                cssVars += `  --navy: ${content.secondary_color};\n`;
            }
            cssVars += '}\n';
            styleEl.innerHTML = cssVars;
        }

        // ── Hero badge ────────────────────────────────────────────────────────
        const heroBadge = document.querySelector('.hero-badge');
        if (heroBadge && content.hero_badge) {
            // preserve the SVG clock icon, update only text node
            const textNode = [...heroBadge.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
            if (textNode) textNode.textContent = '\n            ' + content.hero_badge + '\n          ';
        }

        // ── Hero Image ─────────────────────────────────────────────────────────
        const heroPhoto = document.querySelector('.hero-photo');
        if (heroPhoto && content.hero_image) heroPhoto.src = content.hero_image;

        // ── Hero H1 ───────────────────────────────────────────────────────────
        const heroH1 = document.querySelector('.hero-left h1');
        if (heroH1 && content.hero_title) heroH1.innerHTML = content.hero_title;

        // ── Hero Bullets ──────────────────────────────────────────────────────
        const bullets = document.querySelectorAll('.hero-highlights li');
        ['hero_bullet_1', 'hero_bullet_2', 'hero_bullet_3', 'hero_bullet_4'].forEach((key, i) => {
            if (bullets[i] && content[key]) {
                // text node after the svg
                const textNode = [...bullets[i].childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                if (textNode) textNode.textContent = '\n              ' + content[key] + '\n            ';
            }
        });

        // ── Hero Buttons ──────────────────────────────────────────────────────
        const heroRegBtn = document.querySelector('.hero-register-btn');
        if (heroRegBtn && content.hero_register_label && content.hero_register_price) {
            heroRegBtn.textContent = `${content.hero_register_label} — ${content.hero_register_price}`;
        }
        const heroLearnBtn = document.querySelector('.hero-learn-btn');
        if (heroLearnBtn && content.hero_learn_label) heroLearnBtn.textContent = content.hero_learn_label;

        // ── Hero floating cards ───────────────────────────────────────────────
        const ratingNum = document.querySelector('.hero-float--rating .hero-float-num');
        setText('hero_rating', ratingNum);
        const studentsNum = document.querySelector('.hero-float--students .hero-float-num');
        setText('hero_students', studentsNum);

        // ── Countdown ─────────────────────────────────────────────────────────
        const countdownLabel = document.querySelector('.countdown-label');
        setText('countdown_label', countdownLabel);
        // Update the countdown target (main.js reads window.COUNTDOWN_DATE)
        if (content.countdown_date) window.COUNTDOWN_DATE = content.countdown_date;

        // ── Stats Bar ─────────────────────────────────────────────────────────
        const statNums = document.querySelectorAll('.stat-num');
        const statDescs = document.querySelectorAll('.stat-desc');
        const statKeys = ['stat_students', 'stat_experience', 'stat_modules', 'stat_duration'];
        statKeys.forEach((key, i) => {
            if (statNums[i] && content[key]) statNums[i].textContent = content[key];
        });

        // ── Curriculum header ────────────────────────────────────────────────
        const currLabel = document.querySelector('#learn .section-label');
        setText('curriculum_section_label', currLabel);
        const currTitle = document.querySelector('#learn .section-title');
        setText('curriculum_title', currTitle);
        const currSub = document.querySelector('#learn .section-sub');
        setText('curriculum_sub', currSub);

        // ── About Instructor ─────────────────────────────────────────────────
        const aboutPhoto = document.querySelector('.about-photo');
        if (aboutPhoto && content.about_image) aboutPhoto.src = content.about_image;

        const aboutHeading = document.querySelector('.about-text h2');
        if (aboutHeading && content.about_heading) aboutHeading.innerHTML = content.about_heading;
        const instrName = document.querySelector('.about-text h3');
        setText('about_instructor_name', instrName);
        const abBios = document.querySelectorAll('.about-text p');
        ['about_bio_1', 'about_bio_2', 'about_bio_3'].forEach((key, i) => {
            if (abBios[i] && content[key]) abBios[i].textContent = content[key];
        });
        // About floating cards
        const aboutStatNums = document.querySelectorAll('.about-stat-num');
        ['about_exp_years', 'about_students', 'about_modules'].forEach((key, i) => {
            if (aboutStatNums[i] && content[key]) aboutStatNums[i].textContent = content[key];
        });

        // ── Event Details ─────────────────────────────────────────────────────
        const eventValues = document.querySelectorAll('.event-item-value');
        // date, time, format, seats, payment, whatsapp
        const eventFields = ['event_date', 'event_time', 'event_format', 'event_seats', 'event_payment', 'event_whatsapp'];
        eventFields.forEach((key, i) => {
            if (eventValues[i] && content[key]) eventValues[i].textContent = content[key];
        });
        // Price
        const priceTag = document.querySelector('.price-tag');
        setText('event_price', priceTag);
        const priceNote = document.querySelector('.price-note');
        setText('event_price_note', priceNote);
        // Register buttons in details section
        const detailsRegBtn = document.querySelector('.pricing-hero .btn-primary');
        if (detailsRegBtn && content.hero_register_label) {
            const firstTextNode = [...detailsRegBtn.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
            if (firstTextNode) firstTextNode.textContent = '\n          ' + content.hero_register_label + '\n          ';
        }
        // Nav CTA
        const navCTA = document.querySelector('.nav-cta .btn-primary');
        if (navCTA && content.nav_cta_label) navCTA.textContent = content.nav_cta_label;
        const mobileCTA = document.querySelector('.nav-mobile .btn-primary');
        if (mobileCTA && content.hero_register_price) mobileCTA.textContent = `Register Now — ${content.hero_register_price}`;

        // ── Newsletter ────────────────────────────────────────────────────────
        const nlHeading = document.querySelector('.newsletter h2');
        if (nlHeading && content.newsletter_heading) nlHeading.innerHTML = content.newsletter_heading;
        const nlSub = document.querySelector('.newsletter p');
        setText('newsletter_sub', nlSub);

        // ── Footer ────────────────────────────────────────────────────────────
        const footerCopy = document.querySelector('.footer-copy');
        if (footerCopy && content.footer_copyright) footerCopy.innerHTML = content.footer_copyright;
        const waBtn = document.querySelector('.whatsapp-btn');
        if (waBtn && content.social_whatsapp) {
            waBtn.href = content.social_whatsapp;
            const waLabel = waBtn.querySelector('svg') ? [...waBtn.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()) : null;
            if (waLabel && content.footer_whatsapp_label) waLabel.textContent = '\n          ' + content.footer_whatsapp_label + '\n        ';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadContent);
    } else {
        loadContent();
    }
})();
