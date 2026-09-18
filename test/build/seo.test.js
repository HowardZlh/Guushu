// L2 - Per-article SEO checks over the built site.
//
// Two groups:
//   * "template" checks: guaranteed by build.py/base.html for every post.
//     Always blocking.
//   * "content" checks: the SEO rules from docs/article-authoring-prompt.md
//     (description length, title length, internal links, image alt, no
//     escaped blockquote). Blocking by default now that the backlog of
//     older posts has been rewritten (PRs #9, #10 and the 2026 batch). Set
//     SEO_STRICT=0 to fall back to report-only mode, e.g. while drafting a
//     batch of new posts locally.
//
// Site directory can be overridden with SITE_DIR env var.

const fs = require('fs');
const path = require('path');
const { describe, it, assertTrue } = require('../test-runner');

const SITE_DIR = process.env.SITE_DIR
    ? path.resolve(process.env.SITE_DIR)
    : path.join(process.cwd(), '_site');

const STRICT = process.env.SEO_STRICT !== '0';

// Character budgets. Google shows roughly 30 CJK chars / 60 Latin chars of a
// title and 80 CJK chars / 160 Latin chars of a description before cutting.
// zh budgets are in CJK-equivalents: a Latin letter, digit or space is about
// half the width of a Han character, so "2027 年度色 Luminous Blue" costs
// 12 + 0.5*... rather than 24 (see width()).
const LIMITS = {
    zh: { titleMax: 30, descMin: 60, descMax: 90 },
    en: { titleMax: 60, descMin: 130, descMax: 165 },
};

const CJK = /[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

function width(text, lang) {
    const chars = [...text];
    if (lang === 'en') return chars.length;
    return Math.round(chars.reduce((n, c) => n + (CJK.test(c) ? 1 : 0.5), 0));
}

// Alt texts that describe nothing. Matched case-insensitively, whole string.
const PLACEHOLDER_ALT = /^(image|photo|picture|一张图|图片|fashion|style|look|detail)s?$/i;

function walk(dir, out) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
}

// Post pages live at /YYYY/MM/DD/slug/index.html and /en/YYYY/MM/DD/slug/index.html
function postPages() {
    if (!fs.existsSync(SITE_DIR)) return [];
    return walk(SITE_DIR, [])
        .map(f => path.relative(SITE_DIR, f).split(path.sep).join('/'))
        .filter(rel => /^(en\/)?\d{4}\/\d{2}\/\d{2}\/[^/]+\/index\.html$/.test(rel))
        .sort();
}

function attr(html, re) {
    const m = html.match(re);
    return m ? m[1] : null;
}

function decode(s) {
    return String(s)
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function analyse(rel) {
    const html = fs.readFileSync(path.join(SITE_DIR, rel), 'utf8');
    const lang = rel.startsWith('en/') ? 'en' : 'zh';
    const limits = LIMITS[lang];
    const problems = [];
    const templateProblems = [];

    // --- template-level -------------------------------------------------
    if (!/<meta property="article:modified_time" content="[^"]+"/.test(html)) {
        templateProblems.push('missing article:modified_time');
    }
    const ldRaw = attr(html, /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    let ld = null;
    try { ld = ldRaw ? JSON.parse(ldRaw) : null; } catch (e) { /* reported below */ }
    if (!ld) templateProblems.push('JSON-LD missing or unparsable');
    else {
        if (!ld.dateModified) templateProblems.push('JSON-LD lacks dateModified');
        if (ld.dateModified && ld.datePublished && ld.dateModified < ld.datePublished) {
            templateProblems.push('JSON-LD dateModified earlier than datePublished');
        }
    }
    if (/<meta property="og:image" /.test(html) && !/<meta property="og:image:alt" content="[^"]+"/.test(html)) {
        templateProblems.push('og:image without og:image:alt');
    }

    // --- content-level --------------------------------------------------
    const fullTitle = decode(attr(html, /<title>([^<]*)<\/title>/) || '');
    const title = fullTitle.replace(/ \| Guushu 谷序$/, '');
    const tlen = width(title, lang);
    if (tlen > limits.titleMax) {
        problems.push(`title width ${tlen} > ${limits.titleMax}: "${title}"`);
    }

    const desc = decode(attr(html, /<meta name="description" content="([^"]*)"/) || '');
    const dlen = width(desc, lang);
    if (dlen < limits.descMin || dlen > limits.descMax) {
        problems.push(`description width ${dlen}, want ${limits.descMin}-${limits.descMax}`);
    }

    const body = attr(html, /<div class="post-content">([\s\S]*?)<\/div>\s*(?:<div class="post-tags">|<\/div>\s*<\/article>)/) || '';

    const internal = [...body.matchAll(/<a [^>]*href="(\/[^"]*)"/g)]
        .map(m => m[1])
        .filter(h => /^\/(en\/)?\d{4}\/\d{2}\/\d{2}\//.test(h));
    if (internal.length === 0) problems.push('no internal link to another post');
    const wrongLang = internal.filter(h => lang === 'en' ? !h.startsWith('/en/') : h.startsWith('/en/'));
    if (wrongLang.length) problems.push(`internal link crosses language: ${wrongLang.join(', ')}`);
    for (const h of internal) {
        const target = path.join(SITE_DIR, h.replace(/^\//, ''), 'index.html');
        if (!fs.existsSync(target)) problems.push(`internal link target missing: ${h}`);
    }

    for (const m of body.matchAll(/<img [^>]*>/g)) {
        const alt = decode(attr(m[0], /alt="([^"]*)"/) || '');
        if (!alt.trim()) problems.push('image without alt');
        else if (PLACEHOLDER_ALT.test(alt.trim())) problems.push(`placeholder alt "${alt}"`);
        else if (lang === 'zh' && !/[\u3400-\u9fff]/.test(alt)) problems.push(`zh page has non-Chinese alt "${alt}"`);
    }

    if (/<p>&gt;\s/.test(body)) problems.push('literal "&gt;" where a blockquote was meant');

    return { rel, lang, problems, templateProblems };
}

const pages = postPages();

describe('SEO: post pages discovered', () => {
    it('finds post pages in the build output', () => {
        assertTrue(pages.length > 0, `no post pages under ${SITE_DIR}`);
    });
});

const results = pages.map(analyse);

describe('SEO: template guarantees (always blocking)', () => {
    it('every post has article:modified_time, JSON-LD dateModified and og:image:alt', () => {
        const bad = results.filter(r => r.templateProblems.length);
        assertTrue(bad.length === 0,
            bad.map(r => `${r.rel}: ${r.templateProblems.join('; ')}`).join('\n  '));
    });
});

describe(`SEO: article content rules (${STRICT ? 'blocking; set SEO_STRICT=0 for report only' : 'report only'})`, () => {
    const bad = results.filter(r => r.problems.length);
    const summary = `${bad.length}/${results.length} posts with issues`;
    if (STRICT) {
        results.forEach(r => {
            it(`${r.rel}`, () => {
                assertTrue(r.problems.length === 0, r.problems.join('; '));
            });
        });
    } else {
        it(`content report: ${summary}`, () => {
            bad.forEach(r => {
                console.log(`     ⚠ ${r.rel}`);
                r.problems.forEach(p => console.log(`        - ${p}`));
            });
            assertTrue(true);
        });
    }
});
