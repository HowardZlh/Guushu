#!/usr/bin/env python3
"""
Guushu static site builder (Python replacement for Jekyll).

Design goals:
  * Reproduce the existing URL structure and page semantics exactly enough to
    satisfy the L2 (build-output) and L3 (snapshot) test suites.
  * Handle the site's real structure: a few Markdown posts (zh + en mirror)
    plus several hand-written HTML pages, with a directory-mirror bilingual
    scheme (/en/...).

Pipeline:
  1. Load site config + translations.
  2. Parse posts (Markdown + YAML front matter) -> render bodies.
  3. Render hand-written HTML pages (treated as Jinja2 templates) through the
     base layout.
  4. Render posts through the post layout.
  5. Render the blog listing.
  6. Emit feed.xml (Atom).
  7. Compile SCSS and copy static assets.

Dependencies: Jinja2, Markdown, PyYAML  (see requirements.txt)
"""

import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone, timedelta

import yaml
import markdown as md
from jinja2 import Environment, FileSystemLoader, ChoiceLoader, DictLoader

ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(ROOT, "_site")
TEMPLATES = os.path.join(ROOT, "templates")

# --- Site configuration (mirrors the relevant bits of the old _config.yml) ---
SITE = {
    "title": "Guushu 谷序",
    "description": "Contemporary Fashion for the Modern Woman",
    "url": "https://www.guushu.com",
    "paginate": 6,
}

CST = timezone(timedelta(hours=8))  # +0800, matching the original posts

FRONT_MATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.DOTALL)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_translations():
    with open(os.path.join(ROOT, "_data", "translations.yml"), encoding="utf-8") as f:
        return yaml.safe_load(f)


def parse_front_matter(text):
    """Return (meta_dict, body_str). Body is '' when there is no front matter."""
    m = FRONT_MATTER_RE.match(text)
    if not m:
        return {}, text
    meta = yaml.safe_load(m.group(1)) or {}
    return meta, m.group(2)


def render_markdown(body):
    return md.markdown(
        body,
        extensions=["extra", "toc"],
        output_format="html5",
    )


def strip_html(text):
    return re.sub(r"<[^>]+>", "", text or "")


def truncate_words(text, n):
    words = text.split()
    return " ".join(words[:n])


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def write_page(rel_path, html):
    out = os.path.join(OUTPUT, rel_path)
    ensure_dir(os.path.dirname(out))
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)


# ---------------------------------------------------------------------------
# Content loading
# ---------------------------------------------------------------------------
def load_posts():
    """Load zh posts (_posts) and en posts (en/_posts)."""
    posts = []
    sources = [
        (os.path.join(ROOT, "_posts"), "zh", "/{y}/{m}/{d}/{slug}/"),
        (os.path.join(ROOT, "en", "_posts"), "en", "/en/{y}/{m}/{d}/{slug}/"),
    ]
    for folder, default_lang, url_tpl in sources:
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            if not name.endswith(".md"):
                continue
            mdate = re.match(r"(\d{4})-(\d{2})-(\d{2})-(.+)\.md$", name)
            if not mdate:
                continue
            y, mo, d, slug = mdate.groups()
            with open(os.path.join(folder, name), encoding="utf-8") as f:
                meta, body = parse_front_matter(f.read())
            lang = meta.get("lang", default_lang)
            date = datetime(int(y), int(mo), int(d), tzinfo=CST)
            url = url_tpl.format(y=y, m=mo, d=d, slug=slug)
            content_html = render_markdown(body)
            posts.append({
                "title": meta.get("title", ""),
                "description": meta.get("description", ""),
                "image": meta.get("image", ""),
                "tags": meta.get("tags", []),
                "author": meta.get("author", "Guushu Team"),
                "lang": lang,
                "date": date,
                "date_display": date.strftime("%B %d, %Y").replace(" 0", " "),
                "date_xml": date.isoformat(),
                "url": url,
                "content": content_html,
                "excerpt": strip_html(body.strip().split("\n\n")[0]) if body.strip() else "",
                "slug": slug,
            })
    # Newest first (matches Jekyll's site.posts ordering)
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


# ---------------------------------------------------------------------------
# HTML page rendering (hand-written pages treated as Jinja2 templates)
# ---------------------------------------------------------------------------
# Map source HTML files -> output path + explicit lang.
HTML_PAGES = [
    # (source, output_rel, lang, lang_explicit, url)
    ("index.html",         "index.html",                 "zh", True,  "/"),
    ("about.html",         "about/index.html",           "zh", False, "/about/index.html"),
    ("fashion-news.html",  "fashion-news/index.html",    "zh", False, "/fashion-news/index.html"),
    ("404.html",           "404/index.html",             "zh", False, "/404.html"),
    ("en/index.html",      "en/index.html",              "en", True,  "/en/"),
    ("en/about.html",      "en/about/index.html",        "en", False, "/en/about/index.html"),
    ("en/fashion-news.html","en/fashion-news/index.html","en", False, "/en/fashion-news/index.html"),
    ("en/404.html",        "en/404/index.html",          "en", False, "/en/404.html"),
]


def build_html_pages(env, translations, posts):
    for src, out_rel, lang, lang_explicit, url in HTML_PAGES:
        src_path = os.path.join(ROOT, src)
        if not os.path.exists(src_path):
            continue
        with open(src_path, encoding="utf-8") as f:
            meta, body = parse_front_matter(f.read())
        # Convert Liquid-ism {{ site.data.translations... }} etc. The bodies use
        # a small, known set of Liquid tags; translate them to Jinja2.
        body = liquid_to_jinja(body)
        page = {
            "title": meta.get("title", SITE["title"]),
            "description": meta.get("description", SITE["description"]),
            "lang": meta.get("lang", lang),
            "lang_explicit": lang_explicit,
            "url": url,
        }
        # Render the page body first (it may reference site/translations/posts)
        body_tpl = env.from_string("{% extends 'page.html' %}{% block content %}" + body + "{% endblock %}")
        html = body_tpl.render(
            site=SITE, page=dict(page, content=""),
            translations=translations, posts=posts,
            strip_html=strip_html, truncate_words=truncate_words,
        )
        write_page(out_rel, html)


def liquid_to_jinja(body):
    """Translate the limited Liquid used in the hand-written pages to Jinja2."""
    # site.data.translations.X.Y.Z -> translations.X.Y.Z
    body = body.replace("site.data.translations", "translations")
    # site.baseurl -> '' (baseurl is empty)
    body = body.replace("{{ site.baseurl }}", "")
    # Liquid post loops -> Jinja2. Handle the two known patterns explicitly.
    # zh: {% assign non_english_posts = site.posts | where_exp: "post","post.lang != 'en'" %}
    body = re.sub(
        r"{%\s*assign\s+non_english_posts\s*=.*?%}",
        "{% set non_english_posts = posts | selectattr('lang','equalto','zh') | list %}",
        body, flags=re.DOTALL,
    )
    body = re.sub(
        r"{%\s*assign\s+english_posts\s*=.*?%}",
        "{% set english_posts = posts | selectattr('lang','equalto','en') | list %}",
        body, flags=re.DOTALL,
    )
    # {% for post in X limit:6 %} -> {% for post in X[:6] %}
    body = re.sub(r"{%\s*for\s+post\s+in\s+(\w+)\s+limit:\s*6\s*%}",
                  r"{% for post in \1[:6] %}", body)
    # Filters inside expressions
    #   post.image | default: post.hero | relative_url  -> post.image
    body = re.sub(r"{{\s*post\.image\s*\|[^}]*}}", "{{ post.image }}", body)
    #   post.url | relative_url -> post.url
    body = re.sub(r"{{\s*post\.url\s*\|\s*relative_url\s*}}", "{{ post.url }}", body)
    #   post.description | strip_html | truncatewords: 15
    body = re.sub(r"{{\s*post\.description\s*\|\s*strip_html\s*\|\s*truncatewords:\s*15\s*}}",
                  "{{ truncate_words(strip_html(post.description), 15) }}", body)
    #   '/assets/...' | relative_url -> /assets/...
    body = re.sub(r"{{\s*'([^']+)'\s*\|\s*relative_url\s*}}", r"\1", body)
    # site.posts.size -> posts | length ; but only zh or en subset matters for the
    # "read more" button. Original uses site.posts.size (all posts = 6) > 6 == False.
    body = body.replace("{% if site.posts.size > 6 %}", "{% if (posts | length) > 6 %}")
    return body


# ---------------------------------------------------------------------------
# Posts + blog
# ---------------------------------------------------------------------------
def build_posts(env, posts):
    tpl = env.get_template("post.html")
    for p in posts:
        page = dict(p)
        page["lang_explicit"] = True
        out_rel = p["url"].strip("/") + "/index.html"
        html = tpl.render(site=SITE, page=page)
        write_page(out_rel, html)


BLOG_TEMPLATE = """{% extends "base.html" %}
{% block content %}
<section class="blog-list">
    <h1>All Posts</h1>
    <div class="grid">
        {% for post in posts %}
        <article class="card">
            <a href="{{ post.url }}">
                <img src="{{ post.image }}" alt="{{ post.title }}">
                <h3>{{ post.title }}</h3>
                <time datetime="{{ post.date_xml }}">{{ post.date.strftime('%Y-%m-%d') }}</time>
                <p>{{ truncate_words(strip_html(post.excerpt), 20) }}</p>
            </a>
        </article>
        {% endfor %}
    </div>
</section>
{% endblock %}
"""


def build_blog(env, posts):
    tpl = env.from_string(BLOG_TEMPLATE)
    page = {"title": "Blog", "description": SITE["description"],
            "lang": "zh", "lang_explicit": False, "url": "/blog/index.html"}
    html = tpl.render(site=SITE, page=page, posts=posts,
                      strip_html=strip_html, truncate_words=truncate_words)
    write_page("blog/index.html", html)


# ---------------------------------------------------------------------------
# Feed
# ---------------------------------------------------------------------------
def build_feed(posts):
    updated = datetime.now(CST).isoformat()
    entries = []
    for p in posts:
        entries.append(
            f'<entry><title type="html">{p["title"]}</title>'
            f'<link href="{SITE["url"]}{p["url"]}" rel="alternate" type="text/html" title="{p["title"]}" />'
            f'<published>{p["date_xml"]}</published>'
            f'<updated>{p["date_xml"]}</updated>'
            f'<id>{SITE["url"]}{p["url"].rstrip("/")}</id>'
            f'<content type="html" xml:base="{SITE["url"]}{p["url"]}">{p["content"]}</content>'
            f'</entry>'
        )
    feed = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<feed xmlns="http://www.w3.org/2005/Atom">'
        '<generator uri="https://www.guushu.com/">guushu-build</generator>'
        f'<link href="{SITE["url"]}/feed.xml" rel="self" type="application/atom+xml" />'
        f'<link href="{SITE["url"]}/" rel="alternate" type="text/html" />'
        f'<updated>{updated}</updated>'
        f'<id>{SITE["url"]}/feed.xml</id>'
        f'<title type="html">{SITE["title"]}</title>'
        f'<subtitle>{SITE["description"]}</subtitle>'
        + "".join(entries) +
        '</feed>'
    )
    write_page("feed.xml", feed)


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
def compile_scss():
    src = os.path.join(ROOT, "assets", "css", "style.scss")
    out = os.path.join(OUTPUT, "assets", "css", "style.css")
    ensure_dir(os.path.dirname(out))
    # The entry SCSS carries a Jekyll front matter block ("---\n---") that
    # dart-sass cannot parse; strip it, then compile from a temp file placed
    # next to the source so relative @use paths still resolve.
    with open(src, encoding="utf-8") as f:
        scss = f.read()
    scss = re.sub(r"^---\s*\n---\s*\n?", "", scss)
    tmp = os.path.join(ROOT, "assets", "css", ".style.build.scss")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(scss)
    try:
        result = subprocess.run(
            ["npx", "sass", "--style=compressed", "--no-source-map",
             f"--load-path={os.path.join(ROOT, '_sass')}", tmp, out],
            capture_output=True, text=True,
        )
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise SystemExit("SCSS compilation failed")


ASSET_DIRS = ["assets/js", "assets/post", "assets/audio", "assets/favicon_io"]
ASSET_FILES = ["CNAME", "favicon.ico"]


def copy_assets():
    for d in ASSET_DIRS:
        src = os.path.join(ROOT, d)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(OUTPUT, d), dirs_exist_ok=True)
    for f in ASSET_FILES:
        src = os.path.join(ROOT, f)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(OUTPUT, f))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    if os.path.isdir(OUTPUT):
        shutil.rmtree(OUTPUT)
    ensure_dir(OUTPUT)

    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=False,
        trim_blocks=False,
        lstrip_blocks=False,
    )

    translations = load_translations()
    posts = load_posts()

    build_html_pages(env, translations, posts)
    build_posts(env, posts)
    build_blog(env, posts)
    build_feed(posts)
    compile_scss()
    copy_assets()

    print(f"Built site -> {OUTPUT} ({len(posts)} posts)")


if __name__ == "__main__":
    main()
