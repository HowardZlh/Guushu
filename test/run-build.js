// L2 + L3 test entry point (requires a built site in ./_site or $SITE_DIR).
// Run a build first, e.g.:  bundle exec jekyll build
const { runTests } = require('./test-runner');
runTests([
    './test/build/build-output.test.js',
    './test/build/snapshot.test.js'
]);
