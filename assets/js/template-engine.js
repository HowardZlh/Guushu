// Template Engine - Lightweight tagged template literal with auto-escaping
// Provides safe HTML generation for dynamic components

const SAFE_HTML_SYMBOL = Symbol('safeHtml');

/**
 * Escape HTML special characters to prevent XSS
 * @param {*} str - Value to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Mark a string as safe HTML (won't be re-escaped by html``)
 * @param {string} str - HTML string that is already safe
 * @returns {Object} Safe HTML wrapper
 */
function safeHtml(str) {
    return {
        [SAFE_HTML_SYMBOL]: true,
        toString() { return String(str); },
        valueOf() { return String(str); },
        [Symbol.toPrimitive]() { return String(str); }
    };
}

/**
 * Check if a value is a safeHtml wrapper
 * @param {*} val - Value to check
 * @returns {boolean}
 */
function isSafeHtml(val) {
    return val != null && typeof val === 'object' && val[SAFE_HTML_SYMBOL] === true;
}

/**
 * Tagged template literal that auto-escapes interpolated values.
 * Arrays are joined. safeHtml() wrappers are preserved as-is.
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {Object} safeHtml wrapper containing the final HTML string
 */
function html(strings, ...values) {
    const result = strings.reduce((acc, str, i) => {
        const val = values[i];
        if (val == null) {
            return acc + str;
        }

        // Handle arrays (e.g., .map() results)
        if (Array.isArray(val)) {
            const joined = val.map(v => isSafeHtml(v) ? String(v) : escapeHtml(String(v))).join('');
            return acc + str + joined;
        }

        // Handle safeHtml wrappers (trusted HTML from sub-components)
        if (isSafeHtml(val)) {
            return acc + str + String(val);
        }

        // Default: escape raw values
        return acc + str + escapeHtml(String(val));
    }, '');

    return safeHtml(result);
}

// Node.js / CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml, safeHtml, html, isSafeHtml, SAFE_HTML_SYMBOL };
}

// Browser global
if (typeof window !== 'undefined') {
    window.TemplateEngine = { escapeHtml, safeHtml, html, isSafeHtml, SAFE_HTML_SYMBOL };
}
