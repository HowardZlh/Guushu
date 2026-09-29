#!/usr/bin/env node
/**
 * IndexNow push after each deploy: read the built sitemap (_site/sitemap.xml),
 * keep the URLs that belong to this host and POST them once to
 * api.indexnow.org (shared by Bing, Yandex, Seznam, Naver; Google does not
 * take part in IndexNow).
 *
 *   node scripts/indexnow.mjs [--dry-run] [--sitemap _site/sitemap.xml]
 *
 * Why this exists: the site sits behind Cloudflare, but HTML comes back as
 * `cf-cache-status: DYNAMIC`, so Cloudflare Crawler Hints never pushes it.
 * Reading the sitemap from the build output (not from production) also avoids
 * the zone's bot rules, which challenge GitHub runner IPs.
 *
 * The key is public by design (the protocol serves it at
 * https://<host>/<key>.txt). The same key is used by the other guushu.com
 * sites; test/indexnow.test.mjs pins key == key file name == key file content
 * and checks build.py copies the file into _site. A failed push only logs a
 * warning and exits 0: indexing hints must never fail a deploy.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const INDEXNOW_KEY = "a186e762669a42dd38d3b506035e3ccc";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const HOST = "fashion.guushu.com";
/** IndexNow accepts at most 10,000 URLs per request. */
export const MAX_URLS = 10000;

/** sitemap XML -> list of <loc> values (unescapes &amp;). */
export function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/** Keep https URLs on `host`, de-duplicated, order kept, capped at MAX_URLS. */
export function urlsForHost(locs, host) {
  const seen = new Set();
  const out = [];
  for (const loc of locs) {
    let u;
    try {
      u = new URL(loc);
    } catch {
      continue;
    }
    if (u.protocol !== "https:" || u.hostname !== host || seen.has(u.href)) continue;
    seen.add(u.href);
    out.push(u.href);
    if (out.length >= MAX_URLS) break;
  }
  return out;
}

export function buildPayload(host, urlList, key = INDEXNOW_KEY) {
  return { host, key, keyLocation: `https://${host}/${key}.txt`, urlList };
}

/** IndexNow status code -> verdict (200 OK, 202 received / key pending, rest = failure). */
export function describeStatus(status) {
  if (status === 200) return { ok: true, note: "accepted" };
  if (status === 202) return { ok: true, note: "received, key validation pending" };
  const why = {
    400: "bad request",
    403: "key not valid for host",
    422: "URLs do not belong to host or key mismatch",
    429: "too many requests",
  };
  return { ok: false, note: why[status] ?? `unexpected status ${status}` };
}

/** POST the payload. Network errors are returned, not thrown. */
export async function submit(host, urlList, { fetchImpl = fetch, key = INDEXNOW_KEY } = {}) {
  if (urlList.length === 0) return { ok: false, status: 0, note: "no URLs to submit" };
  try {
    const res = await fetchImpl(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(buildPayload(host, urlList, key)),
    });
    return { status: res.status, ...describeStatus(res.status) };
  } catch (err) {
    return { ok: false, status: 0, note: `network error: ${err.message}` };
  }
}

export function parseArgs(argv) {
  const args = { dryRun: false, sitemap: "_site/sitemap.xml" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--sitemap") args.sitemap = argv[++i];
  }
  return args;
}

export async function main(argv, { fetchImpl = fetch, log = console.log, read = readFileSync } = {}) {
  const args = parseArgs(argv);
  let xml;
  try {
    xml = read(args.sitemap, "utf8");
  } catch (err) {
    log(`::warning::IndexNow skipped: cannot read ${args.sitemap} (${err.message})`);
    return 0;
  }
  const urls = urlsForHost(parseSitemapLocs(xml), HOST);
  if (args.dryRun) {
    log(`IndexNow dry run: ${urls.length} URL(s) for ${HOST}`);
    for (const u of urls) log(`  ${u}`);
    return 0;
  }
  const r = await submit(HOST, urls, { fetchImpl });
  if (r.ok) log(`IndexNow OK · ${HOST} · ${urls.length} URL(s) · ${r.status} ${r.note}`);
  else log(`::warning::IndexNow FAIL · ${HOST} · ${urls.length} URL(s) · ${r.status} ${r.note}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await main(process.argv.slice(2));
}
