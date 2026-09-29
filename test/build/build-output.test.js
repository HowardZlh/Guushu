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
    '404.html',
    'en/index.html',
    'en/about/index.html',
    'en/fashion-news/index.html',
    'en/404.html',
    '2025/01/15/boho-chic-revival/index.html',
    '2025/01/20/yellow-trends/index.html',
    '2025/01/25/elevated-sportswear/index.html',
    'en/2025/01/15/boho-chic-revival/index.html',
    'en/2025/01/20/yellow-trends/index.html',
    'en/2025/01/25/elevated-sportswear/index.html',
    'feed.xml',
    'sitemap.xml',
    'robots.txt',
    'BingSiteAuth.xml',
    'a186e762669a42dd38d3b506035e3ccc.txt',
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
        assertIncludes(html, '<meta property="og:image" content="https://fashion.guushu.com/assets/img/posts/boho-chic-revival.jpg" />');
        assertEqual(ld.image[0], 'https://fashion.guushu.com/assets/img/posts/boho-chic-revival.jpg');
    });

    it('social-card images are self-hosted, absolute, and shipped in the build', () => {
        const pages = fs.readdirSync(SITE_DIR, { recursive: true })
            .filter(p => p.endsWith('index.html'))
            .map(p => p.toString());
        assertTrue(pages.length > 50, `expected the whole site, got ${pages.length} pages`);
        const seen = new Set();
        for (const rel of pages) {
            const html = read(rel);
            const og = html.match(/<meta property="og:image" content="([^"]+)" \/>/);
            assertTrue(og !== null, `${rel}: missing og:image`);
            assertMatch(og[1], /^https:\/\/fashion\.guushu\.com\/assets\/img\/.+\.jpg$/);
            assertTrue(!html.includes('images.unsplash.com'), `${rel}: still hotlinks Unsplash`);
            assertIncludes(html, '<meta property="og:image:width" content="1200" />');
            assertIncludes(html, '<meta property="og:image:height" content="630" />');
            assertIncludes(html, `<meta name="twitter:image" content="${og[1]}" />`);
            assertIncludes(html, '<meta name="twitter:card" content="summary_large_image" />');
            seen.add(og[1].replace('https://fashion.guushu.com/', ''));
        }
        for (const img of seen) {
            assertTrue(exists(img), `og:image file not in build output: ${img}`);
        }
        // Non-post pages fall back to the brand image.
        assertIncludes(read('about/index.html'), 'og:image" content="https://fashion.guushu.com/assets/img/og-default.jpg"');
    });

    it('post cards and bodies use the same self-hosted image', () => {
        assertIncludes(read('index.html'), '<img src="/assets/img/posts/');
        assertIncludes(read('2025/01/15/boho-chic-revival/index.html'), 'src="/assets/img/posts/boho-chic-revival.jpg"');
    });

    it('language redirect only fires from the site root', () => {
        const html = read('fashion-news/index.html');
        assertIncludes(html, "var isRoot = path === '/' || path === '/index.html';");
        assertTrue(!html.includes("window.location.href = '/en' + currentPath"), 'old deep-link redirect must be gone');
    });
});

// Every generated HTML page, relative to SITE_DIR ('/'-separated).
function htmlPages() {
    return fs.readdirSync(SITE_DIR, { recursive: true })
        .map(p => p.toString().split(path.sep).join('/'))
        .filter(p => p.endsWith('.html'));
}

function jsonLd(html) {
    return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
        .map(m => JSON.parse(m[1]));
}

function ldTypes(html) {
    return jsonLd(html).flatMap(ld => (ld['@graph'] || [ld]).map(n => n['@type']));
}

describe('Build output: search-engine SEO (Google / Bing)', () => {
    it('404 lives at the artifact root so GitHub Pages serves it, and is noindex', () => {
        for (const rel of ['404.html', 'en/404.html']) {
            const html = read(rel);
            assertIncludes(html, '<meta name="robots" content="noindex" />', `${rel}: noindex`);
            assertTrue(!html.includes('rel="canonical"'), `${rel}: 404 must not declare canonical`);
            assertTrue(!html.includes('hreflang="x-default"'), `${rel}: 404 must not declare hreflang`);
        }
        assertTrue(!exists('404/index.html'), 'old 404/index.html path must be gone');
    });

    it('only 404 pages are noindex', () => {
        const noindex = htmlPages().filter(rel => read(rel).includes('name="robots" content="noindex"'));
        assertEqual(noindex.sort().join(','), '404.html,en/404.html');
    });

    it('every page carries parseable JSON-LD', () => {
        for (const rel of htmlPages()) {
            assertTrue(jsonLd(read(rel)).length > 0 || rel.endsWith('404.html'), `${rel}: no JSON-LD`);
        }
    });

    it('home pages declare Organization + WebSite tied to Guushu Studio', () => {
        for (const [rel, url, lang] of [['index.html', '/', 'zh'], ['en/index.html', '/en/', 'en']]) {
            const graph = jsonLd(read(rel)).find(ld => ld['@graph'])['@graph'];
            const org = graph.find(n => n['@type'] === 'Organization');
            const site = graph.find(n => n['@type'] === 'WebSite');
            assertEqual(org['@id'], 'https://fashion.guushu.com/#organization');
            assertEqual(org.parentOrganization.name, 'Guushu Studio');
            assertEqual(org.parentOrganization.url, 'https://guushu.com/');
            assertEqual(site.url, `https://fashion.guushu.com${url}`);
            assertEqual(site.inLanguage, lang);
            assertEqual(site.publisher['@id'], org['@id']);
            assertTrue(!ldTypes(read(rel)).includes('BreadcrumbList'), `${rel}: home has no breadcrumb`);
        }
    });

    it('sections and posts have a BreadcrumbList that starts at the same-language home', () => {
        const cases = [
            ['about/index.html', ['首页', '关于我们']],
            ['en/fashion-news/index.html', ['Home', 'Fashion News']],
            ['blog/index.html', ['首页', '所有文章']],
            ['en/2025/01/15/boho-chic-revival/index.html', ['Home', 'All Posts', null]],
        ];
        for (const [rel, names] of cases) {
            const html = read(rel);
            const bc = jsonLd(html).find(ld => ld['@type'] === 'BreadcrumbList');
            assertTrue(bc !== undefined, `${rel}: BreadcrumbList missing`);
            const items = bc.itemListElement;
            assertEqual(items.length, names.length, `${rel}: crumb count`);
            items.forEach((it, i) => {
                assertEqual(it.position, i + 1);
                if (names[i]) assertEqual(it.name, names[i], `${rel}: crumb ${i + 1}`);
            });
            const home = rel.startsWith('en/') ? 'https://fashion.guushu.com/en/' : 'https://fashion.guushu.com/';
            assertEqual(items[0].item, home);
            const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
            assertEqual(items[items.length - 1].item, canonical, `${rel}: last crumb = canonical`);
        }
        // Posts keep Article as the first JSON-LD block (seo.test.js reads it).
        assertEqual(jsonLd(read('2025/01/15/boho-chic-revival/index.html'))[0]['@type'], 'Article');
    });

    it('internal links use canonical URLs (no index.html, directories end with /)', () => {
        const bad = [];
        for (const rel of htmlPages()) {
            for (const m of read(rel).matchAll(/<a [^>]*href="(\/[^"#?]*)"/g)) {
                const href = m[1];
                if (href.startsWith('/cdn-cgi/') || href.startsWith('/assets/')) continue;
                if (href.endsWith('index.html') || !/(\/|\.[a-z]+)$/.test(href)) bad.push(`${rel} -> ${href}`);
            }
        }
        assertTrue(bad.length === 0, bad.slice(0, 10).join('\n  '));
    });

    it('nav highlights the current section', () => {
        assertMatch(read('about/index.html'), /<a href="\/about\/" class="active">/);
        assertMatch(read('en/fashion-news/index.html'), /<a href="\/en\/fashion-news\/" class="active">/);
    });

    it('English home links to the English post listing', () => {
        const html = read('en/index.html');
        assertTrue(!/href="\/blog\/"/.test(html), 'en home must not link to the zh listing');
    });

    it('ships the Bing ownership file and the IndexNow key file', () => {
        assertIncludes(read('BingSiteAuth.xml'), '<user>A653F3D4867CCD7EAB62DA269181DCC2</user>');
        assertEqual(read('a186e762669a42dd38d3b506035e3ccc.txt').trim(), 'a186e762669a42dd38d3b506035e3ccc');
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
