// Lightweight test runner (no external dependencies)
let passed = 0;
let failed = 0;

function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ❌ ${name}`);
        console.log(`     ${e.message}`);
    }
}

function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error(
            (msg || 'Assertion failed') +
            `:\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
        );
    }
}

function assertTrue(actual, msg) {
    if (actual !== true) {
        throw new Error((msg || 'Assertion failed') + `: expected true, got ${JSON.stringify(actual)}`);
    }
}

function assertFalse(actual, msg) {
    if (actual !== false) {
        throw new Error((msg || 'Assertion failed') + `: expected false, got ${JSON.stringify(actual)}`);
    }
}

function assertIncludes(haystack, needle, msg) {
    const str = String(haystack);
    if (!str.includes(needle)) {
        throw new Error(
            (msg || 'Assertion failed') +
            `:\n  haystack: ${JSON.stringify(str)}\n  needle:   ${JSON.stringify(needle)}`
        );
    }
}

function assertNotIncludes(haystack, needle, msg) {
    const str = String(haystack);
    if (str.includes(needle)) {
        throw new Error(
            (msg || 'Assertion failed') +
            `:\n  haystack: ${JSON.stringify(str)}\n  should NOT include: ${JSON.stringify(needle)}`
        );
    }
}

function assertMatch(haystack, regex, msg) {
    const str = String(haystack);
    if (!regex.test(str)) {
        throw new Error(
            (msg || 'Assertion failed') +
            `:\n  haystack: ${JSON.stringify(str)}\n  should match: ${regex}`
        );
    }
}

function assertThrows(fn, msg) {
    let threw = false;
    try {
        fn();
    } catch (e) {
        threw = true;
    }
    if (!threw) {
        throw new Error((msg || 'Assertion failed') + ': expected function to throw, but it did not');
    }
}

function assertDoesNotThrow(fn, msg) {
    try {
        fn();
    } catch (e) {
        throw new Error((msg || 'Assertion failed') + `: expected function not to throw, but it threw: ${e.message}`);
    }
}

function assertDeepEqual(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
        throw new Error(
            (msg || 'Assertion failed') +
            `:\n  expected: ${b}\n  actual:   ${a}`
        );
    }
}

function runTests(testFiles) {
    const path = require('path');
    testFiles.forEach(file => {
        const resolved = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
        require(resolved);
    });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`${'='.repeat(50)}`);

    if (failed > 0) {
        process.exit(1);
    }
}

module.exports = { describe, it, assertEqual, assertTrue, assertFalse, assertIncludes, assertNotIncludes, assertMatch, assertThrows, assertDoesNotThrow, assertDeepEqual, runTests };
