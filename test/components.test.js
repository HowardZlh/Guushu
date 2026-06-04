const { describe, it, assertEqual, assertTrue, assertFalse, assertIncludes, assertNotIncludes } = require('./test-runner');

// Mock browser globals before requiring components
const TE = require('../assets/js/template-engine');
global.window = { TemplateEngine: TE };
global.document = { documentElement: { lang: 'zh' } };

const { Components } = require('../assets/js/components');

describe('Components.createFashionCard', () => {
    it('renders basic structure with correct classes', () => {
        const result = Components.createFashionCard({
            title: 'Yellow Trends',
            description: 'Spring collection',
            image: 'https://example.com/yellow.jpg',
            link: '/fashion-news/yellow/'
        });
        const html = String(result);
        assertIncludes(html, 'class="fashion-card"');
        assertIncludes(html, 'src="https://example.com/yellow.jpg"');
        assertIncludes(html, 'alt="Yellow Trends"');
        assertIncludes(html, 'href="/fashion-news/yellow/"');
        assertIncludes(html, 'class="btn btn-outline"');
    });

    it('escapes XSS in title and description', () => {
        const result = Components.createFashionCard({
            title: '<script>alert(1)</script>',
            description: '<img src=x onerror=alert(1)>',
            image: 'pic.jpg',
            link: '/test'
        });
        const html = String(result);
        assertNotIncludes(html, '<script>', 'should not contain raw script tag');
        assertIncludes(html, '&lt;script&gt;alert(1)&lt;/script&gt;', 'title should be fully escaped');
        assertIncludes(html, '<p>&lt;img src=x onerror=alert(1)&gt;</p>', 'description img should be escaped inside p tag');
    });

    it('renders tags when provided', () => {
        const result = Components.createFashionCard({
            title: 'Test',
            description: 'Desc',
            tags: ['yellow', '2025', 'trend']
        });
        const html = String(result);
        assertIncludes(html, '<span class="tag">yellow</span>');
        assertIncludes(html, '<span class="tag">2025</span>');
        assertIncludes(html, '<div class="card-tags">');
    });

    it('omits card-tags when tags array is empty', () => {
        const result = Components.createFashionCard({
            title: 'Test',
            description: 'Desc',
            tags: []
        });
        const html = String(result);
        assertNotIncludes(html, 'card-tags');
    });

    it('omits image when image is empty', () => {
        const result = Components.createFashionCard({
            title: 'Test',
            description: 'Desc',
            image: ''
        });
        const html = String(result);
        assertNotIncludes(html, '<img');
    });

    it('uses default values when called with no arguments', () => {
        const result = Components.createFashionCard();
        const html = String(result);
        assertIncludes(html, 'class="fashion-card"');
        assertIncludes(html, 'href="#"');
        assertNotIncludes(html, '<img');
    });

    it('escapes XSS in tags', () => {
        const result = Components.createFashionCard({
            title: 'Test',
            description: 'Desc',
            tags: ['<script>evil</script>']
        });
        const html = String(result);
        assertNotIncludes(html, '<script>');
        assertIncludes(html, '&lt;script&gt;');
    });

    it('shows Chinese CTA by default', () => {
        const result = Components.createFashionCard({ title: 'T', description: 'D' });
        const html = String(result);
        assertIncludes(html, '了解更多');
    });

    it('shows English CTA when document.lang is en', () => {
        const prevLang = document.documentElement.lang;
        document.documentElement.lang = 'en';
        const result = Components.createFashionCard({ title: 'T', description: 'D' });
        const html = String(result);
        assertIncludes(html, 'Learn More');
        document.documentElement.lang = prevLang;
    });
});

describe('Components.createTrendItem', () => {
    it('renders basic structure', () => {
        const result = Components.createTrendItem({
            title: 'Boho Revival',
            description: 'Flowing silhouettes',
            season: 'SS2025'
        });
        const html = String(result);
        assertIncludes(html, 'class="trend-item"');
        assertIncludes(html, '<h3>Boho Revival</h3>');
        assertIncludes(html, '<p>Flowing silhouettes</p>');
        assertIncludes(html, '季节：');
        assertIncludes(html, 'SS2025');
    });

    it('includes growth when provided', () => {
        const result = Components.createTrendItem({
            title: 'T',
            description: 'D',
            season: 'S',
            growth: '+11%'
        });
        const html = String(result);
        assertIncludes(html, '增长：');
        assertIncludes(html, '+11%');
    });

    it('omits growth when not provided', () => {
        const result = Components.createTrendItem({
            title: 'T',
            description: 'D',
            season: 'S'
        });
        const html = String(result);
        assertNotIncludes(html, '增长：');
    });

    it('escapes XSS in all fields', () => {
        const result = Components.createTrendItem({
            title: '<b>evil</b>',
            description: '<i>evil</i>',
            season: '<u>evil</u>',
            growth: '<s>evil</s>'
        });
        const html = String(result);
        assertNotIncludes(html, '<b>evil</b>');
        assertNotIncludes(html, '<i>evil</i>');
        assertNotIncludes(html, '<u>evil</u>');
        assertNotIncludes(html, '<s>evil</s>');
    });
});

describe('Components.createNewsletterForm', () => {
    it('renders Chinese version by default', () => {
        const result = Components.createNewsletterForm();
        const html = String(result);
        assertIncludes(html, '订阅时尚资讯');
        assertIncludes(html, '请输入您的邮箱');
        assertIncludes(html, '订阅');
    });

    it('renders English version when lang is en', () => {
        const result = Components.createNewsletterForm({ lang: 'en' });
        const html = String(result);
        assertIncludes(html, 'Subscribe to Fashion News');
        assertIncludes(html, 'Enter your email');
        assertIncludes(html, 'Subscribe');
    });

    it('has correct form structure', () => {
        const result = Components.createNewsletterForm();
        const html = String(result);
        assertIncludes(html, 'class="newsletter-section"');
        assertIncludes(html, 'class="newsletter-form"');
        assertIncludes(html, 'type="email"');
        assertIncludes(html, 'required');
    });
});

describe('Components.createPagination', () => {
    it('shows prev and next on middle page', () => {
        const result = Components.createPagination({ currentPage: 2, totalPages: 3, baseUrl: '/blog/' });
        const html = String(result);
        assertIncludes(html, 'href="/blog/page1/"');
        assertIncludes(html, '上一页');
        assertIncludes(html, 'href="/blog/page3/"');
        assertIncludes(html, '下一页');
        assertIncludes(html, '第 2 页，共 3 页');
    });

    it('hides prev on first page', () => {
        const result = Components.createPagination({ currentPage: 1, totalPages: 3 });
        const html = String(result);
        assertNotIncludes(html, '上一页');
        assertIncludes(html, '下一页');
    });

    it('hides next on last page', () => {
        const result = Components.createPagination({ currentPage: 3, totalPages: 3 });
        const html = String(result);
        assertIncludes(html, '上一页');
        assertNotIncludes(html, '下一页');
    });

    it('shows English text when lang is en', () => {
        const prevLang = document.documentElement.lang;
        document.documentElement.lang = 'en';
        const result = Components.createPagination({ currentPage: 2, totalPages: 3 });
        const html = String(result);
        assertIncludes(html, 'Previous');
        assertIncludes(html, 'Next');
        assertIncludes(html, 'Page 2 of 3');
        document.documentElement.lang = prevLang;
    });

    it('uses default baseUrl', () => {
        const result = Components.createPagination({ currentPage: 2, totalPages: 3 });
        const html = String(result);
        assertIncludes(html, 'href="/page1/"');
    });
});

describe('Components.createLoadingSpinner', () => {
    it('renders Chinese text by default', () => {
        const result = Components.createLoadingSpinner();
        const html = String(result);
        assertIncludes(html, 'class="loading-spinner"');
        assertIncludes(html, 'class="spinner"');
        assertIncludes(html, '加载中...');
    });

    it('renders English text when lang is en', () => {
        const result = Components.createLoadingSpinner({ lang: 'en' });
        const html = String(result);
        assertIncludes(html, 'Loading...');
    });
});

describe('Components.createModal', () => {
    it('renders with id, title and content', () => {
        const result = Components.createModal({
            id: 'my-modal',
            title: 'Modal Title',
            content: '<p>Modal body</p>'
        });
        const html = String(result);
        assertIncludes(html, 'id="my-modal"');
        assertIncludes(html, 'class="modal"');
        assertIncludes(html, '<h3>Modal Title</h3>');
        assertIncludes(html, '<p>Modal body</p>');
        assertIncludes(html, 'class="modal-close"');
    });

    it('preserves HTML in content (safeHtml)', () => {
        const result = Components.createModal({
            id: 'test',
            title: 'T',
            content: '<strong>Bold</strong>'
        });
        const html = String(result);
        assertIncludes(html, '<strong>Bold</strong>');
    });

    it('escapes id and title to prevent XSS', () => {
        const result = Components.createModal({
            id: 'id" onclick="evil()',
            title: '<script>',
            content: 'safe'
        });
        const html = String(result);
        assertNotIncludes(html, '<script>');
        assertNotIncludes(html, 'onclick="evil()"');
    });
});

describe('Components.createSearchResults', () => {
    it('renders no-results message when empty', () => {
        const result = Components.createSearchResults({ query: 'xyz' });
        const html = String(result);
        assertIncludes(html, 'class="search-no-results"');
        assertIncludes(html, '未找到与');
        assertIncludes(html, '"xyz"');
    });

    it('renders English no-results when lang is en', () => {
        const prevLang = document.documentElement.lang;
        document.documentElement.lang = 'en';
        const result = Components.createSearchResults({ query: 'xyz' });
        const html = String(result);
        assertIncludes(html, 'No results found for');
        document.documentElement.lang = prevLang;
    });

    it('renders result items when provided', () => {
        const results = [
            { title: 'Result A', url: '/a', excerpt: 'Excerpt A' },
            { title: 'Result B', url: '/b', excerpt: 'Excerpt B' }
        ];
        const result = Components.createSearchResults({ results, query: 'test' });
        const html = String(result);
        assertIncludes(html, 'class="search-results-list"');
        assertIncludes(html, 'class="search-result-item"');
        assertIncludes(html, 'href="/a"');
        assertIncludes(html, 'Result A');
        assertIncludes(html, 'Excerpt A');
        assertIncludes(html, 'href="/b"');
    });

    it('escapes XSS in search query display', () => {
        const result = Components.createSearchResults({ query: '<script>' });
        const html = String(result);
        assertNotIncludes(html, '<script>');
        assertIncludes(html, '&lt;script&gt;');
    });

    it('escapes XSS in result fields', () => {
        const results = [
            { title: '<b>evil</b>', url: '/x', excerpt: '<i>evil</i>' }
        ];
        const result = Components.createSearchResults({ results, query: 'q' });
        const html = String(result);
        assertNotIncludes(html, '<b>evil</b>');
        assertNotIncludes(html, '<i>evil</i>');
    });
});

describe('Components.init', () => {
    it('exists and is callable', () => {
        assertTrue(typeof Components.init === 'function');
    });
});

describe('Components.closeModal', () => {
    it('hides modal by id when document exists', () => {
        const mockModal = { style: { display: 'block' } };
        global.document.getElementById = (id) => {
            if (id === 'test-modal') return mockModal;
            return null;
        };
        Components.closeModal('test-modal');
        assertEqual(mockModal.style.display, 'none');
    });

    it('does not throw when modal not found', () => {
        global.document.getElementById = () => null;
        // Should not throw
        Components.closeModal('missing');
    });
});
