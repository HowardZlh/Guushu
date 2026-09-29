// IndexNow push script: pure functions, transport (success / non-2xx / network
// error / empty list) and the key-file contract. Run: node --test test/indexnow.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HOST,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  MAX_URLS,
  buildPayload,
  describeStatus,
  main,
  parseArgs,
  parseSitemapLocs,
  submit,
  urlsForHost,
} from "../scripts/indexnow.mjs";

const SITEMAP = `<?xml version="1.0"?><urlset>
<url><loc>https://fashion.guushu.com/</loc></url>
<url><loc> https://fashion.guushu.com/a/?x=1&amp;y=2 </loc></url>
<url><loc>https://fashion.guushu.com/</loc></url>
<url><loc>https://guushu.com/notes/</loc></url>
<url><loc>http://fashion.guushu.com/plain/</loc></url>
<url><loc>not-a-url</loc></url>
</urlset>`;

test("parseSitemapLocs trims and unescapes", () => {
  const locs = parseSitemapLocs(SITEMAP);
  assert.equal(locs.length, 6);
  assert.equal(locs[1], "https://fashion.guushu.com/a/?x=1&y=2");
});

test("urlsForHost keeps https on host, de-duplicates, drops junk", () => {
  assert.deepEqual(urlsForHost(parseSitemapLocs(SITEMAP), HOST), [
    "https://fashion.guushu.com/",
    "https://fashion.guushu.com/a/?x=1&y=2",
  ]);
});

test("urlsForHost caps at MAX_URLS", () => {
  const locs = Array.from({ length: MAX_URLS + 5 }, (_, i) => `https://${HOST}/p${i}/`);
  assert.equal(urlsForHost(locs, HOST).length, MAX_URLS);
});

test("buildPayload points keyLocation at the host root", () => {
  assert.deepEqual(buildPayload(HOST, ["u"]), {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: ["u"],
  });
});

test("describeStatus maps documented codes", () => {
  assert.equal(describeStatus(200).ok, true);
  assert.equal(describeStatus(202).ok, true);
  assert.deepEqual(describeStatus(403), { ok: false, note: "key not valid for host" });
  assert.deepEqual(describeStatus(500), { ok: false, note: "unexpected status 500" });
});

test("submit: success posts JSON to the endpoint", async () => {
  let call;
  const r = await submit(HOST, ["https://fashion.guushu.com/"], {
    fetchImpl: async (url, init) => {
      call = { url, init };
      return { status: 200 };
    },
  });
  assert.deepEqual(r, { status: 200, ok: true, note: "accepted" });
  assert.equal(call.url, INDEXNOW_ENDPOINT);
  assert.equal(call.init.method, "POST");
  assert.equal(JSON.parse(call.init.body).urlList.length, 1);
});

test("submit: non-2xx, network error and empty list are failures, not throws", async () => {
  assert.equal((await submit(HOST, ["u"], { fetchImpl: async () => ({ status: 422 }) })).ok, false);
  const net = await submit(HOST, ["u"], {
    fetchImpl: async () => {
      throw new Error("boom");
    },
  });
  assert.deepEqual(net, { ok: false, status: 0, note: "network error: boom" });
  let called = false;
  const empty = await submit(HOST, [], {
    fetchImpl: async () => {
      called = true;
      return { status: 200 };
    },
  });
  assert.equal(empty.ok, false);
  assert.equal(called, false);
});

test("parseArgs defaults and flags", () => {
  assert.deepEqual(parseArgs([]), { dryRun: false, sitemap: "_site/sitemap.xml" });
  assert.deepEqual(parseArgs(["--dry-run", "--sitemap", "x.xml"]), { dryRun: true, sitemap: "x.xml" });
});

test("main: dry run lists URLs, never fetches, exits 0", async () => {
  const lines = [];
  const code = await main(["--dry-run"], {
    read: () => SITEMAP,
    log: (l) => lines.push(l),
    fetchImpl: async () => assert.fail("must not fetch"),
  });
  assert.equal(code, 0);
  assert.match(lines[0], /2 URL\(s\)/);
});

test("main: failures only warn and still exit 0", async () => {
  const lines = [];
  const log = (l) => lines.push(l);
  assert.equal(await main([], { read: () => SITEMAP, log, fetchImpl: async () => ({ status: 403 }) }), 0);
  assert.equal(await main([], { read: () => SITEMAP, log, fetchImpl: async () => ({ status: 200 }) }), 0);
  const unreadable = () => {
    throw new Error("ENOENT");
  };
  assert.equal(await main([], { read: unreadable, log }), 0);
  assert.match(lines[0], /^::warning::IndexNow FAIL/);
  assert.match(lines[1], /^IndexNow OK/);
  assert.match(lines[2], /^::warning::IndexNow skipped/);
});

test("key file contract: name == content == INDEXNOW_KEY, copied by build.py; HOST == CNAME", () => {
  const file = `${INDEXNOW_KEY}.txt`;
  assert.equal(readFileSync(new URL(`../${file}`, import.meta.url), "utf8").trim(), INDEXNOW_KEY);
  const build = readFileSync(new URL("../build.py", import.meta.url), "utf8");
  const assetLine = build.split("\n").find((l) => l.startsWith("ASSET_FILES"));
  assert.ok(assetLine.includes(`"${file}"`), "build.py ASSET_FILES must copy the IndexNow key file");
  assert.ok(assetLine.includes('"BingSiteAuth.xml"'), "build.py ASSET_FILES must copy BingSiteAuth.xml");
  assert.equal(readFileSync(new URL("../CNAME", import.meta.url), "utf8").trim(), HOST);
});
