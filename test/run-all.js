// L1 test entry point — pure JavaScript unit tests (no build required).
// For build-output (L2) and snapshot (L3) tests, run: node test/run-build.js
const { runTests } = require('./test-runner');
runTests([
    './test/template-engine.test.js',
    './test/components.test.js',
    './test/main.test.js',
    './test/search.test.js'
]);
