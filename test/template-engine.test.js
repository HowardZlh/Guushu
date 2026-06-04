const { describe, it, assertEqual, assertTrue, assertFalse, assertIncludes, assertNotIncludes } = require('./test-runner');
const { escapeHtml, safeHtml, html, isSafeHtml } = require('../assets/js/template-engine');

describe('escapeHtml', () => {
    it('escapes & to &amp;', () => {
        assertEqual(escapeHtml('A & B'), 'A &amp; B');
    });

    it('escapes < to &lt;', () => {
        assertEqual(escapeHtml('<div>'), '&lt;div&gt;');
    });

    it('escapes " to &quot;', () => {
        assertEqual(escapeHtml('say "hello"'), 'say &quot;hello&quot;');
    });

    it('escapes single quote to &#039;', () => {
        assertEqual(escapeHtml("it's"), 'it&#039;s');
    });

    it('returns empty string for null', () => {
        assertEqual(escapeHtml(null), '');
    });

    it('returns empty string for undefined', () => {
        assertEqual(escapeHtml(undefined), '');
    });

    it('converts numbers to string and escapes', () => {
        assertEqual(escapeHtml(123), '123');
    });

    it('escapes complex XSS payload', () => {
        const payload = '<script>alert("xss")</script>';
        const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
        assertEqual(escapeHtml(payload), expected);
    });
});

describe('safeHtml', () => {
    it('returns an object with safeHtml symbol', () => {
        const safe = safeHtml('<b>bold</b>');
        assertTrue(isSafeHtml(safe), 'should be recognized as safeHtml');
    });

    it('converts to string correctly', () => {
        const safe = safeHtml('<b>bold</b>');
        assertEqual(String(safe), '<b>bold</b>');
    });

    it('does not escape plain strings', () => {
        assertFalse(isSafeHtml('plain string'));
    });

    it('does not escape null', () => {
        assertFalse(isSafeHtml(null));
    });
});

describe('html tagged template literal', () => {
    it('returns safeHtml wrapper', () => {
        const result = html`<div>hello</div>`;
        assertTrue(isSafeHtml(result), 'result should be safeHtml');
    });

    it('auto-escapes interpolated values', () => {
        const userInput = '<script>alert(1)</script>';
        const result = html`<p>${userInput}</p>`;
        const str = String(result);
        assertNotIncludes(str, '<script>', 'should not contain raw script tag');
        assertIncludes(str, '&lt;script&gt;', 'should contain escaped script tag');
    });

    it('preserves safeHtml wrappers without re-escaping', () => {
        const subComponent = safeHtml('<span class="icon">★</span>');
        const result = html`<div>${subComponent}</div>`;
        const str = String(result);
        assertIncludes(str, '<span class="icon">★</span>', 'safeHtml should be preserved');
        assertNotIncludes(str, '&lt;span', 'safeHtml should not be re-escaped');
    });

    it('handles arrays by joining and escaping each item', () => {
        const items = ['<b>one</b>', '<i>two</i>'];
        const result = html`<ul>${items.map(item => html`<li>${item}</li>`)}</ul>`;
        const str = String(result);
        assertIncludes(str, '&lt;b&gt;one&lt;/b&gt;', 'first item should be escaped');
        assertIncludes(str, '&lt;i&gt;two&lt;/i&gt;', 'second item should be escaped');
        assertIncludes(str, '<li>', 'li tags from template should be preserved');
    });

    it('handles arrays with safeHtml items', () => {
        const items = [safeHtml('<b>one</b>'), safeHtml('<i>two</i>')];
        const result = html`<div>${items}</div>`;
        const str = String(result);
        assertIncludes(str, '<b>one</b>', 'safeHtml item should not be escaped');
        assertIncludes(str, '<i>two</i>', 'safeHtml item should not be escaped');
    });

    it('handles null and undefined values', () => {
        const result = html`<p>${null} and ${undefined}</p>`;
        const str = String(result);
        assertEqual(str, '<p> and </p>');
    });

    it('handles numbers correctly', () => {
        const count = 42;
        const result = html`<span>${count}</span>`;
        assertEqual(String(result), '<span>42</span>');
    });

    it('produces correct fashion card-like output', () => {
        const title = 'Yellow Trends';
        const description = 'Spring <summer> collection';
        const image = 'https://example.com/pic.jpg?w=800';
        const result = html`
            <div class="fashion-card">
                <img src="${image}" alt="${title}">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
        const str = String(result);
        assertIncludes(str, 'src="https://example.com/pic.jpg?w=800"');
        assertIncludes(str, 'alt="Yellow Trends"');
        assertIncludes(str, '&lt;summer&gt;', 'angle brackets in description should be escaped');
    });
});
