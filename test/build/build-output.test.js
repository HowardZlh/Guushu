// L2 - Build output structure tests (build-tool agnostic)
// Asserts that the generated static site (default: ./_site) contains the
// expected pages, structure, bilingual symmetry, pagination, feed and SEO meta.
//
// These tests do NOT depend on Jekyll specifics — they inspect the final
// HTML/XML artifacts. After migrating to another build tool (Pelican/JBake/…),
// running the same suite against the new output verifies behavioural parity.
//
// Site directory can be overridden with SITE_DIR env var.

const fs = require('fs');
const path = require('path');
const { describe, it, assertTrue, assertEqual, assertIncludes, assertMatch } = require('../test-runner');

const SITE_DIR = process.env.SITE_DIR
    ? path.resolve(process.env.SITE_DIR)
    : path.join(process.cwd(), '_site');

function read(rel) {
    return fs.readFileSync(path.join(SITE_DIR, rel), 'utf8');
}
function exists(rel) {
    return fs.existsSync(path.join(SITE_DIR, rel));
}

// Key pages expected in every build (language-agnostic contract).
const EXPECTED_PAGES = [
    'index.html',
    'about/index.html',
    'fashion-news/index.html',
    'blog/index.html',
    '404/index.html',
    'en/index.html',
    'en/about/index.html',
    'en/fashion-news/index.html',
    'en/404/index.html',
    '2025/01/15/boho-chic-revival/index.html',
    '2025/01/20/yellow-trends/index.html',
    '2025/01/25/elevated-sportswear/index.html',
    'en/2025/01/15/boho-chic-revival/index.html',
    'en/2025/01/20/yellow-trends/index.html',
    'en/2025/01/25/elevated-sportswear/index.html',
    'feed.xml',
    'assets/css/style.css'
];

describe('Build output: site directory', () => {
    it('site directory exists (run a build first)', () => {
        assertTrue(fs.existsSync(SITE_DIR), `expected build output at ${SITE_DIR}`);
    });
});

describe('Build output: expected pages exist', () => {
    EXPECTED_PAGES.forEach(page => {
        it(`generates ${page}`, () => {
            assertTrue(exists(page), `missing generated file: ${page}`);
        });
    });
});

describe('Build output: bilingual symmetry', () => {
    it('has matching zh and en home pages with correct lang attribute', () => {
        assertMatch(read('index.html'), /<html[^>]*lang="zh"/);
        assertMatch(read('en/index.html'), /<html[^>]*lang="en"/);
    });

    it('every zh post has an en counterpart', () => {
        const posts = [
            '2025/01/15/boho-chic-revival/index.html',
            '2025/01/20/yellow-trends/index.html',
            '2025/01/25/elevated-sportswear/index.html'
        ];
        posts.forEach(p => {
            assertTrue(exists(p), `zh post missing: ${p}`);
            assertTrue(exists('en/' + p), `en post missing: en/${p}`);
        });
    });

    it('en post declares lang=en', () => {
        assertMatch(read('en/2025/01/15/boho-chic-revival/index.html'), /<html[^>]*lang="en"/);
    });
});

describe('Build output: SEO & metadata', () => {
    it('home page has title and description meta', () => {
        const html = read('index.html');
        assertMatch(html, /<title>[^<]+<\/title>/);
        assertMatch(html, /<meta name="description" content="[^"]+"/);
    });

    it('home page has canonical link', () => {
        assertIncludes(read('index.html'), 'rel="canonical"');
    });

    it('home page links stylesheet', () => {
        assertIncludes(read('index.html'), '/assets/css/style.css');
    });

    it('home page references the site JS bundle', () => {
        const html = read('index.html');
        assertIncludes(html, 'template-engine.js');
        assertIncludes(html, 'components.js');
        assertIncludes(html, 'main.js');
    });

    it('post <title> carries the site name; hand-written pages do not double it', () => {
        assertMatch(read('2025/01/15/boho-chic-revival/index.html'), /<title>[^<]+ \| Guushu 谷序<\/title>/);
        assertMatch(read('about/index.html'), /<title>关于谷序 \| 品牌故事与时尚哲学<\/title>/);
    });

    it('zh/en pages declare hreflang alternates pointing at each other', () => {
        const zh = read('2025/01/15/boho-chic-revival/index.html');
        const en = read('en/2025/01/15/boho-chic-revival/index.html');
        assertIncludes(zh, 'hreflang="en" href="https://fashion.guushu.com/en/2025/01/15/boho-chic-revival/"');
        assertIncludes(en, 'hreflang="zh" href="https://fashion.guushu.com/2025/01/15/boho-chic-revival/"');
        assertIncludes(en, 'hreflang="x-default" href="https://fashion.guushu.com/2025/01/15/boho-chic-revival/"');
    });

    it('hand-written pages use clean canonical URLs (no index.html)', () => {
        assertIncludes(read('about/index.html'), 'rel="canonical" href="https://fashion.guushu.com/about/"');
        assertIncludes(read('en/fashion-news/index.html'), 'rel="canonical" href="https://fashion.guushu.com/en/fashion-news/"');
    });

    it('posts emit Article JSON-LD and article Open Graph tags', () => {
        const html = read('2025/01/15/boho-chic-revival/index.html');
        assertIncludes(html, '<script type="application/ld+json">');
        const ld = JSON.parse(html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)[1]);
        assertEqual(ld['@type'], 'Article');
        assertTrue(ld.headline.length > 0);
        assertMatch(ld.datePublished, /^2025-01-15T/);
        assertIncludes(html, '<meta property="og:type" content="article" />');
        assertIncludes(html, '<meta property="og:image" content="https://images.unsplash.com/');
    });

    it('language redirect only fires from the site root', () => {
        const html = read('fashion-news/index.html');
        assertIncludes(html, "var isRoot = path === '/' || path === '/index.html';");
        assertTrue(!html.includes("window.location.href = '/en' + currentPath"), 'old deep-link redirect must be gone');
    });
});

describe('Build output: sitemap & robots', () => {
    it('sitemap.xml lists pages and posts in both languages with hreflang alternates', () => {
        const xml = read('sitemap.xml');
        assertMatch(xml, /<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
        assertIncludes(xml, '<loc>https://fashion.guushu.com/</loc>');
        assertIncludes(xml, '<loc>https://fashion.guushu.com/en/</loc>');
        assertIncludes(xml, '<loc>https://fashion.guushu.com/2025/01/15/boho-chic-revival/</loc>');
        assertIncludes(xml, '<loc>https://fashion.guushu.com/en/2025/01/15/boho-chic-revival/</loc>');
        assertIncludes(xml, 'hreflang="x-default"');
        assertTrue(!xml.includes('/404'), 'sitemap must not list 404 pages');
    });

    it('robots.txt allows crawling and points at the sitemap', () => {
        const txt = read('robots.txt');
        assertIncludes(txt, 'Allow: /');
        assertIncludes(txt, 'Sitemap: https://fashion.guushu.com/sitemap.xml');
    });
});

describe('Build output: posts content', () => {
    it('boho post renders its title', () => {
        assertIncludes(read('2025/01/15/boho-chic-revival/index.html'), '波西米亚');
    });

    it('post body is rendered from markdown to HTML', () => {
        const html = read('2025/01/25/elevated-sportswear/index.html');
        assertMatch(html, /<h[23][^>]*>/);
    });
});

describe('Build output: blog listing & pagination', () => {
    it('blog index lists posts', () => {
        const html = read('blog/index.html');
        // three posts exist; listing should reference at least one post URL
        assertMatch(html, /2025\/01\/\d{2}\//);
    });
});

describe('Build output: RSS feed', () => {
    it('feed.xml is a valid Atom feed', () => {
        const xml = read('feed.xml');
        assertMatch(xml, /<feed[^>]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
        assertIncludes(xml, '<title');
        assertIncludes(xml, '<entry>');
    });

    it('feed contains post entries', () => {
        const xml = read('feed.xml');
        assertIncludes(xml, 'elevated-sportswear');
    });

    it('feed escapes HTML bodies so the XML stays well-formed', () => {
        const xml = read('feed.xml');
        assertIncludes(xml, '<content type="html" xml:base="https://fashion.guushu.com/');
        assertIncludes(xml, '&lt;p&gt;');
        assertTrue(!/<content[^>]*><p>/.test(xml), 'raw <p> inside <content> means the body was not escaped');
    });
});

describe('Build output: CSS compilation', () => {
    it('style.css is compiled and non-empty', () => {
        const css = read('assets/css/style.css');
        assertTrue(css.length > 100, 'compiled CSS should be non-trivial');
    });
});
