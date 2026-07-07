// L3 - HTML snapshot tests (migration golden baseline)
//
// For each key page we produce a NORMALIZED representation of the output and
// compare it against a committed baseline under test/build/__snapshots__/.
//
// Normalization strips build-tool-specific / volatile noise (generator tags,
// version numbers, timestamps, whitespace) so the snapshot captures the
// *semantic* structure of the page rather than Jekyll-specific markup. This is
// what makes the baseline reusable after migrating to Pelican/JBake/etc.
//
// Usage:
//   node test/build/snapshot.test.js            -> compare against baseline
//   UPDATE_SNAPSHOTS=1 node test/build/...       -> (re)generate baseline
//
// Site dir override: SITE_DIR env var (default ./_site)

const fs = require('fs');
const path = require('path');
const { describe, it, assertEqual } = require('../test-runner');

const SITE_DIR = process.env.SITE_DIR
    ? path.resolve(process.env.SITE_DIR)
    : path.join(process.cwd(), '_site');
const SNAP_DIR = path.join(__dirname, '__snapshots__');
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1';

// Pages to snapshot (semantic structure of each).
const SNAPSHOT_PAGES = [
    'index.html',
    'en/index.html',
    'about/index.html',
    '2025/01/15/boho-chic-revival/index.html',
    'en/2025/01/15/boho-chic-revival/index.html'
];

/**
 * Normalize HTML to a build-tool-agnostic, comparable form.
 * Removes volatile / generator-specific content so the same baseline can be
 * validated across different static site generators.
 */
function normalize(html) {
    return html
        // Drop Jekyll SEO tag block (generator-specific)
        .replace(/<!-- Begin Jekyll SEO tag[\s\S]*?<!-- End Jekyll SEO tag -->/g, '')
        // Drop generator meta (name varies per tool)
        .replace(/<meta name="generator"[^>]*>/g, '')
        // Drop any version strings like v4.4.1
        .replace(/v\d+\.\d+\.\d+/g, 'vX.Y.Z')
        // Drop ISO timestamps
        .replace(/\d{4}-\d{2}-\d{2}T[\d:+\-.]+/g, 'TIMESTAMP')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .replace(/> </g, '><')
        .trim();
}

function extractStructure(html) {
    // Capture the semantic skeleton: lang, title, h1-h3 headings, nav/section landmarks.
    const lang = (html.match(/<html[^>]*lang="([a-z-]+)"/) || [])[1] || '';
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const headings = (html.match(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/g) || [])
        .map(h => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    return JSON.stringify({ lang, title, headings }, null, 2);
}

function snapshotName(page) {
    return page.replace(/[\/]/g, '__').replace(/\.html$/, '') + '.snap';
}

describe('HTML snapshots (migration baseline)', () => {
    if (!fs.existsSync(SITE_DIR)) {
        it('site directory exists', () => {
            throw new Error(`No build output at ${SITE_DIR}; run a build first.`);
        });
        return;
    }

    if (UPDATE && !fs.existsSync(SNAP_DIR)) {
        fs.mkdirSync(SNAP_DIR, { recursive: true });
    }

    SNAPSHOT_PAGES.forEach(page => {
        it(`matches snapshot for ${page}`, () => {
            const full = path.join(SITE_DIR, page);
            if (!fs.existsSync(full)) {
                throw new Error(`page not generated: ${page}`);
            }
            const html = fs.readFileSync(full, 'utf8');
            // Snapshot = semantic structure (lang, title, headings).
            // Intentionally build-tool agnostic: whitespace, attribute order and
            // generator-specific meta are NOT part of the contract, so the same
            // baseline is portable across static site generators.
            const current = extractStructure(html);

            const snapPath = path.join(SNAP_DIR, snapshotName(page));

            if (UPDATE) {
                fs.mkdirSync(SNAP_DIR, { recursive: true });
                fs.writeFileSync(snapPath, current, 'utf8');
                return; // baseline written
            }

            if (!fs.existsSync(snapPath)) {
                throw new Error(
                    `Missing snapshot for ${page}. Run: UPDATE_SNAPSHOTS=1 node test/build/snapshot.test.js`
                );
            }
            const baseline = fs.readFileSync(snapPath, 'utf8');
            assertEqual(current, baseline, `snapshot mismatch for ${page}`);
        });
    });
});
