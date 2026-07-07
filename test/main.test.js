const {
    describe, it,
    assertEqual, assertTrue, assertFalse,
    assertIncludes, assertThrows, assertDoesNotThrow
} = require('./test-runner');

// ---------------------------------------------------------------------------
// Lightweight DOM / window mock
// ---------------------------------------------------------------------------
function createClassList(initial = []) {
    const set = new Set(initial);
    return {
        add: (c) => set.add(c),
        remove: (c) => set.delete(c),
        toggle: (c) => { if (set.has(c)) { set.delete(c); return false; } set.add(c); return true; },
        contains: (c) => set.has(c),
        _set: set
    };
}

function createElement(tag = 'div') {
    const el = {
        tagName: tag.toUpperCase(),
        classList: createClassList(),
        style: {},
        innerHTML: '',
        dataset: {},
        attributes: {},
        children: [],
        _listeners: {},
        getAttribute(name) { return this.attributes[name]; },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(type, fn) {
            (this._listeners[type] = this._listeners[type] || []).push(fn);
        },
        dispatch(type, event = {}) {
            (this._listeners[type] || []).forEach(fn => fn.call(this, event));
        },
        querySelector() { return null; },
        appendChild(child) { this.children.push(child); return child; },
        reset() { this._wasReset = true; },
        scrollIntoView(opts) { this._scrolledWith = opts; }
    };
    return el;
}

function installDom({ elements = {}, selectorAll = {} } = {}) {
    const doc = {
        documentElement: { lang: 'zh' },
        head: createElement('head'),
        _listeners: {},
        createElement: (tag) => createElement(tag),
        addEventListener(type, fn) {
            (this._listeners[type] = this._listeners[type] || []).push(fn);
        },
        querySelector(sel) { return elements[sel] || null; },
        querySelectorAll(sel) { return selectorAll[sel] || []; },
        getElementById(id) { return elements['#' + id] || null; }
    };
    const win = {
        pageYOffset: 0,
        _listeners: {},
        addEventListener(type, fn) {
            (this._listeners[type] = this._listeners[type] || []).push(fn);
        }
    };
    global.document = doc;
    global.window = win;
    return { doc, win };
}

function clearDom() {
    delete global.document;
    delete global.window;
    delete global.IntersectionObserver;
    delete global.alert;
    delete require.cache[require.resolve('../assets/js/main')];
}

function loadMainJS() {
    delete require.cache[require.resolve('../assets/js/main')];
    return require('../assets/js/main').MainJS;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MainJS module', () => {
    it('exports MainJS with all expected methods', () => {
        installDom();
        const MainJS = loadMainJS();
        ['toggleMobileNav', 'initSmoothScrolling', 'initHeaderScroll',
         'initLazyLoading', 'initScrollAnimations', 'initNewsletter',
         'initSearch', 'init'].forEach(name => {
            assertEqual(typeof MainJS[name], 'function', `${name} should be a function`);
        });
        clearDom();
    });

    it('exports ANIMATION_STYLES string', () => {
        installDom();
        delete require.cache[require.resolve('../assets/js/main')];
        const mod = require('../assets/js/main');
        assertEqual(typeof mod.ANIMATION_STYLES, 'string');
        assertIncludes(mod.ANIMATION_STYLES, '.animate-in');
        clearDom();
    });

    it('can be required in Node without throwing (no DOM bootstrap)', () => {
        clearDom();
        assertDoesNotThrow(() => {
            require('../assets/js/main');
        });
        clearDom();
    });
});

describe('MainJS.toggleMobileNav', () => {
    it('activates nav and sets close icon when inactive', () => {
        const navLinks = createElement('div');
        const mobileBtn = createElement('button');
        installDom({ elements: { '.nav-links': navLinks, '.mobile-menu-btn': mobileBtn } });
        const MainJS = loadMainJS();
        MainJS.toggleMobileNav();
        assertTrue(navLinks.classList.contains('active'), 'nav should be active');
        assertEqual(mobileBtn.innerHTML, '✕');
        clearDom();
    });

    it('deactivates nav and sets hamburger icon when active', () => {
        const navLinks = createElement('div');
        navLinks.classList.add('active');
        const mobileBtn = createElement('button');
        installDom({ elements: { '.nav-links': navLinks, '.mobile-menu-btn': mobileBtn } });
        const MainJS = loadMainJS();
        MainJS.toggleMobileNav();
        assertFalse(navLinks.classList.contains('active'), 'nav should be inactive');
        assertEqual(mobileBtn.innerHTML, '☰');
        clearDom();
    });

    it('does nothing when elements are missing', () => {
        installDom({ elements: {} });
        const MainJS = loadMainJS();
        assertDoesNotThrow(() => MainJS.toggleMobileNav());
        clearDom();
    });
});

describe('MainJS.initSmoothScrolling', () => {
    it('binds click handlers that scroll to target and prevent default', () => {
        const anchor = createElement('a');
        anchor.setAttribute('href', '#section');
        const target = createElement('section');
        installDom({
            selectorAll: { 'a[href^="#"]': [anchor] }
        });
        // target lookup happens on click
        global.document.querySelector = (sel) => (sel === '#section' ? target : null);
        const MainJS = loadMainJS();
        MainJS.initSmoothScrolling();
        let prevented = false;
        anchor.dispatch('click', { preventDefault: () => { prevented = true; } });
        assertTrue(prevented, 'preventDefault should be called');
        assertEqual(target._scrolledWith.behavior, 'smooth');
        clearDom();
    });

    it('does not throw when anchor target is missing', () => {
        const anchor = createElement('a');
        anchor.setAttribute('href', '#missing');
        installDom({ selectorAll: { 'a[href^="#"]': [anchor] } });
        global.document.querySelector = () => null;
        const MainJS = loadMainJS();
        MainJS.initSmoothScrolling();
        assertDoesNotThrow(() =>
            anchor.dispatch('click', { preventDefault: () => {} })
        );
        clearDom();
    });
});

describe('MainJS.initHeaderScroll', () => {
    it('adds shadow/background when scrolled past 100px', () => {
        const header = createElement('header');
        const { win } = installDom({ elements: { 'header': header } });
        const MainJS = loadMainJS();
        MainJS.initHeaderScroll();
        win.pageYOffset = 150;
        (win._listeners.scroll || []).forEach(fn => fn());
        assertIncludes(header.style.background, '0.98');
        assertIncludes(header.style.boxShadow, 'rgba');
        clearDom();
    });

    it('resets background/shadow when near top', () => {
        const header = createElement('header');
        const { win } = installDom({ elements: { 'header': header } });
        const MainJS = loadMainJS();
        MainJS.initHeaderScroll();
        win.pageYOffset = 10;
        (win._listeners.scroll || []).forEach(fn => fn());
        assertIncludes(header.style.background, '0.95');
        assertEqual(header.style.boxShadow, 'none');
        clearDom();
    });

    it('does nothing when header is absent', () => {
        installDom({ elements: {} });
        const MainJS = loadMainJS();
        assertDoesNotThrow(() => MainJS.initHeaderScroll());
        clearDom();
    });
});

describe('MainJS.initLazyLoading', () => {
    it('observes images via IntersectionObserver and swaps data-src on intersect', () => {
        const img = createElement('img');
        img.dataset.src = '/real.jpg';
        img.classList.add('lazy');
        const observed = [];
        const { win } = installDom({ selectorAll: { 'img[data-src]': [img] } });
        let observerCallback;
        const IO = function (cb) {
            observerCallback = cb;
            return {
                observe: (el) => observed.push(el),
                unobserve: () => {}
            };
        };
        win.IntersectionObserver = IO;      // for `'IntersectionObserver' in window` check
        global.IntersectionObserver = IO;   // for `new IntersectionObserver()` global call
        const MainJS = loadMainJS();
        MainJS.initLazyLoading();
        assertEqual(observed.length, 1, 'one image should be observed');
        // Simulate intersection
        observerCallback(
            [{ isIntersecting: true, target: img }],
            { unobserve: () => {} }
        );
        assertEqual(img.src, '/real.jpg');
        assertFalse(img.classList.contains('lazy'));
        clearDom();
    });

    it('does nothing when IntersectionObserver unsupported', () => {
        installDom({ selectorAll: { 'img[data-src]': [createElement('img')] } });
        // no IntersectionObserver on window
        const MainJS = loadMainJS();
        assertDoesNotThrow(() => MainJS.initLazyLoading());
        clearDom();
    });
});

describe('MainJS.initScrollAnimations', () => {
    it('observes animated elements and adds animate-in on intersect', () => {
        const card = createElement('div');
        const observed = [];
        const { win } = installDom({
            selectorAll: { '.fashion-card, .trend-item, .brand-story-content': [card] }
        });
        let cb;
        const IO = function (callback) {
            cb = callback;
            return { observe: (el) => observed.push(el), unobserve: () => {} };
        };
        win.IntersectionObserver = IO;
        global.IntersectionObserver = IO;
        const MainJS = loadMainJS();
        MainJS.initScrollAnimations();
        assertEqual(observed.length, 1);
        cb([{ isIntersecting: true, target: card }]);
        assertTrue(card.classList.contains('animate-in'));
        clearDom();
    });
});

describe('MainJS.initNewsletter', () => {
    it('accepts valid email and resets the form', () => {
        const form = createElement('form');
        const emailInput = { value: 'user@example.com' };
        form.querySelector = (sel) => (sel === 'input[type="email"]' ? emailInput : null);
        installDom({ elements: { '.newsletter-form': form } });
        let alerted = '';
        global.alert = (msg) => { alerted = msg; };
        const MainJS = loadMainJS();
        MainJS.initNewsletter();
        form.dispatch('submit', { preventDefault: () => {} });
        assertTrue(form._wasReset, 'form should be reset on valid email');
        assertIncludes(alerted, '感谢订阅');
        delete global.alert;
        clearDom();
    });

    it('rejects invalid email and does not reset', () => {
        const form = createElement('form');
        const emailInput = { value: 'not-an-email' };
        form.querySelector = () => emailInput;
        installDom({ elements: { '.newsletter-form': form } });
        let alerted = '';
        global.alert = (msg) => { alerted = msg; };
        const MainJS = loadMainJS();
        MainJS.initNewsletter();
        form.dispatch('submit', { preventDefault: () => {} });
        assertFalse(!!form._wasReset, 'form should not be reset on invalid email');
        assertIncludes(alerted, '有效的邮箱');
        delete global.alert;
        clearDom();
    });

    it('does nothing when form is absent', () => {
        installDom({ elements: {} });
        const MainJS = loadMainJS();
        assertDoesNotThrow(() => MainJS.initNewsletter());
        clearDom();
    });
});

describe('MainJS.initSearch', () => {
    it('binds input handler that clears results for short queries', () => {
        const input = createElement('input');
        const results = createElement('div');
        input.querySelector = () => null;
        installDom({ elements: { '.search-input': input, '.search-results': results } });
        const MainJS = loadMainJS();
        MainJS.initSearch();
        // short query -> should clear + hide
        input.value = 'ab';
        input.dispatch('input');
        assertEqual(results.innerHTML, '');
        assertEqual(results.style.display, 'none');
        clearDom();
    });

    it('does nothing when search elements absent', () => {
        installDom({ elements: {} });
        const MainJS = loadMainJS();
        assertDoesNotThrow(() => MainJS.initSearch());
        clearDom();
    });
});

describe('MainJS.init', () => {
    it('invokes all sub-initializers without throwing', () => {
        const { win } = installDom({ elements: {}, selectorAll: {} });
        const IO = function () { return { observe: () => {}, unobserve: () => {} }; };
        win.IntersectionObserver = IO;
        global.IntersectionObserver = IO;
        const MainJS = loadMainJS();
        const called = {};
        ['initSmoothScrolling', 'initHeaderScroll', 'initLazyLoading',
         'initScrollAnimations', 'initNewsletter', 'initSearch'].forEach(m => {
            const orig = MainJS[m];
            MainJS[m] = function () { called[m] = true; return orig.apply(this, arguments); };
        });
        assertDoesNotThrow(() => MainJS.init());
        ['initSmoothScrolling', 'initHeaderScroll', 'initLazyLoading',
         'initScrollAnimations', 'initNewsletter', 'initSearch'].forEach(m => {
            assertTrue(called[m], `${m} should be called by init`);
        });
        clearDom();
    });

    it('binds mobile menu button click when present', () => {
        const mobileBtn = createElement('button');
        const { win } = installDom({ elements: { '.mobile-menu-btn': mobileBtn } });
        const IO = function () { return { observe: () => {}, unobserve: () => {} }; };
        win.IntersectionObserver = IO;
        global.IntersectionObserver = IO;
        const MainJS = loadMainJS();
        MainJS.init();
        assertTrue((mobileBtn._listeners.click || []).length > 0, 'click handler should be bound');
        clearDom();
    });
});
