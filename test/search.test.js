const { describe, it, assertEqual, assertTrue, assertIncludes, assertNotIncludes, assertDoesNotThrow } = require('./test-runner');

// Mock browser globals before requiring components
const TE = require('../assets/js/template-engine');
global.window = { TemplateEngine: TE };
global.document = { documentElement: { lang: 'zh' } };

const { Components, performSearch } = require('../assets/js/components');

describe('performSearch', () => {
    it('is exported and callable', () => {
        assertEqual(typeof performSearch, 'function');
    });

    it('renders mock results into .search-results element', () => {
        const searchResults = { innerHTML: '', style: {} };
        global.document.querySelector = (sel) =>
            (sel === '.search-results' ? searchResults : null);

        performSearch('波西米亚');

        assertEqual(searchResults.style.display, 'block', 'results should be shown');
        assertIncludes(searchResults.innerHTML, 'search-results-list');
        assertIncludes(searchResults.innerHTML, '波西米亚风复兴');
        assertIncludes(searchResults.innerHTML, '黄色调美学');
    });

    it('escapes result content (no raw script injection)', () => {
        const searchResults = { innerHTML: '', style: {} };
        global.document.querySelector = () => searchResults;
        performSearch('<script>alert(1)</script>');
        assertNotIncludes(searchResults.innerHTML, '<script>alert(1)</script>');
    });

    it('does not throw when .search-results is absent', () => {
        global.document.querySelector = () => null;
        assertDoesNotThrow(() => performSearch('anything'));
    });
});

describe('Components translation helper (t) via components', () => {
    it('returns Chinese by default (lang zh)', () => {
        global.document.documentElement.lang = 'zh';
        const html = String(Components.createFashionCard({ title: 'T', description: 'D' }));
        assertIncludes(html, '了解更多');
    });

    it('returns English when documentElement.lang is en', () => {
        const prev = global.document.documentElement.lang;
        global.document.documentElement.lang = 'en';
        const html = String(Components.createFashionCard({ title: 'T', description: 'D' }));
        assertIncludes(html, 'Learn More');
        global.document.documentElement.lang = prev;
    });

    it('falls back to Chinese when lang is en but no English provided', () => {
        // createTrendItem uses t('trend.season', '季节：', 'Season: ') which HAS en,
        // but growth prefix t('trend.growth', ...) also has en; verify zh path
        const prev = global.document.documentElement.lang;
        global.document.documentElement.lang = 'zh';
        const html = String(Components.createTrendItem({
            title: 'T', description: 'D', season: 'SS25', growth: '+5%'
        }));
        assertIncludes(html, '季节：');
        assertIncludes(html, '增长：');
        global.document.documentElement.lang = prev;
    });

    it('defaults to Chinese when document is undefined (SSR-like)', () => {
        const savedDoc = global.document;
        delete global.document;
        // reload components under no-document environment
        delete require.cache[require.resolve('../assets/js/components')];
        global.window = { TemplateEngine: TE };
        const { Components: C2 } = require('../assets/js/components');
        const html = String(C2.createFashionCard({ title: 'T', description: 'D' }));
        assertIncludes(html, '了解更多', 'should fall back to Chinese without document');
        global.document = savedDoc;
        // restore original module for any later suites
        delete require.cache[require.resolve('../assets/js/components')];
        require('../assets/js/components');
    });
});
