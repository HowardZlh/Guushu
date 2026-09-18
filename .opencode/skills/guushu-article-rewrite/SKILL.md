---
name: guushu-article-rewrite
description: >-
  Batch-rewrite existing Guushu articles (zh `_posts/` + en `en/_posts/` pairs)
  to the "去 AI + SEO" standard set in PR #9 and #10: research-only fact check
  against a source whitelist, keyword-first titles, description widths that
  pass test/build/seo.test.js, `updated:` front matter, keyword image alts,
  same-language internal links, dated sourced details instead of anecdotes,
  and zero hits on check-ai-tells.mjs (copy/zh + copy/en). Use when asked to
  "重写旧文章", "去 AI + SEO 重写", "按 PR #9 的标准改", "批次 N 的文章",
  "de-AI these posts", "make the old articles pass SEO_STRICT", or when
  `SEO_STRICT=1` reports failures on older posts. Built on the global skills
  de-ai-copy-zh / de-ai-copy-en; this file is the project overlay only. Covers
  the branch + gh account check, the research sub-agent prompt (Wikipedia EN /
  Vogue Runway direct URLs, source date earlier than article date, delete what
  can't be verified), the CJK half-width title/description budget script, the
  URL-chars-count-toward-160 paragraph trap, triple-adjective and em-dash
  rewrites, the SEO_STRICT "only this batch must pass" reading, the PR body
  template, and the truncated-file recovery rule.
allowed-tools:
  - read
  - grep
  - glob
  - bash
  - edit
  - write
  - task
triggers:
  - user
  - model
---

# guushu-article-rewrite

叠在全局 skill `de-ai-copy-zh` / `de-ai-copy-en` 之上；本文只写本项目的叠加层。

结果：一批 N 组文章（zh + en 各一份）改完后，`check-ai-tells` 两语 0 违规、
`SEO_STRICT=1` 下本批页面全绿、L1/L2/L3 全过、feed/sitemap 可解析，PR 描述含
「标题改前→改后」表、删除的未核实断言、检查命令输出。

## 机制 / 背景

站点是团队署名（`author: "Guushu Team"`），**不能编个人经历**去「去 AI 味」，
只能用有出处、带日期的具体细节替代。来源规则在 `docs/article-authoring-prompt.md`
§1 / §5；长度阈值以 `test/build/seo.test.js` 的 `LIMITS` 与 `width()` 为准，
不是文档里写的字数。英文版是给英文读者另写的一篇，不是翻译。

## 步骤

### 0. 场景确认（de-ai skill 要求）

任务下达时若已写明「对外文案 / 中英双语 / 趋势科普长文 / 叠加本项目来源规则」，
不必再问；否则按 `de-ai-copy-zh` §0 问一次。

### 1. 分支

```sh
git checkout main && git pull origin main
git checkout -b fix/de-ai-seo-batch-<批次名>
git branch --show-current            # 不得是 main
gh api user -q .login                # 必须打印 HowardZlh
```

### 2. 先跑一次门禁，记下改前数字（进 PR 描述）

zsh 下把文件列表放进数组，字符串会被当成一个路径：

```sh
ZH=(_posts/<a>.md _posts/<b>.md ...); EN=(); for f in $ZH; do EN+=("en/$f"); done
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang zh $ZH
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang en $EN
```

### 3. 事实核查：派 research-only 子 agent

每 3–4 篇一个 `task`（general），prompt 必含：

- 「You MUST NOT write, edit, create, or delete any file anywhere」+ 工作区边界原文。
- 来源白名单：`https://en.wikipedia.org/wiki/...`、
  `https://www.vogue.com/fashion-shows/<season>/<brand>`、`https://www.vogue.com/article/...`。
  搜索引擎被 CAPTCHA 拦，只给直接 URL，失败换 1–2 个再放弃并报「not fetched」。
- **硬规则：来源发布日必须早于文章日期**，每条事实报出来源日期。
- 列出待核查的现有断言，逐条要「exact wording / verdict」。
- 姊妹文章已用过的细节列出来，要求找**不同的**。
- 回报三段：USABLE FACTS（含 URL + 日期）/ CLAIMS TO DELETE / TWO DATED DETAILS。

已知有效 slug：Rabanne 秀评在 `/paco-rabanne` 不是 `/rabanne`；The Row、Alaïa
的 spring-2026 秀评 404。Vogue 趋势汇总文（`/article/spring-2026-fashion-trends`）
可能晚于文章日期，先看日期再用。

### 4. 逐篇重写（zh 与 en 各写一遍）

- front matter 只动 `title` / `title_en` / `description` / `description_en`，
  加 `updated: <今天>`；slug / date / tags / image / author / lang 不动。
- `##` 引子含主关键词并进第一句；`###` 带实体或结论；删「值得记住的一点 /
  One thing to remember」类总结节。
- 图片 URL 不换，先下载看一眼再写 alt（zh 页面中文 alt，带关键词）。
- 1–2 条同语种内链（zh→`/YYYY/...`，en→`/en/YYYY/...`），可指向更晚文章但措辞用
  「另见 / see also」，不写「我们 1 月写过」。不链 `/elevated-sportswear/`（URL 含 elevate 触门禁）。
- 结尾 `> "…" —— Guushu 设计团队`（en 单个 `—`），内容对本文有具体所指。
- 数字多用表格：时间线、色值、城市/年份/组织，表格不计入门禁字数。

### 5. 长度自检（每篇写完立刻跑）

把这段存到预授权临时目录（`/var/folders/.../T/opencode/w.py`）后按文件跑；
它复刻 `seo.test.js` 的 `width()`：zh 按 CJK 等宽，拉丁字符 / 数字 / 空格算 0.5。

```python
import re, sys
CJK = re.compile(r'[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]')
def width(t, lang):
    return len(t) if lang == 'en' else round(sum(1 if CJK.match(c) else 0.5 for c in t))
for f in sys.argv[1:]:
    lang = 'en' if f.startswith('en/') else 'zh'
    fm = open(f, encoding='utf-8').read().split('---')[1]
    g = lambda k: (re.search(r'^%s: "(.*)"$' % k, fm, re.M) or [None, ''])[1]
    lim = {'zh': (30, 60, 90), 'en': (60, 130, 165)}[lang]
    print(f, 'title', width(g('title'), lang), '/', lim[0], '| desc', width(g('description'), lang), lim[1:])
    if lang == 'zh':
        print('   title_en', len(g('title_en')), '/60 | desc_en', len(g('description_en')), '[130-165]')
```

阈值：zh 标题 ≤30、描述 60–90；en 标题 ≤60、描述 130–165。zh 的 `description_en`
与 en 文件的 `description` 必须一字不差。

### 6. 全量验证

```sh
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang zh $ZH
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang en $EN
python3 build.py && node test/run-all.js && node test/run-build.js
SEO_STRICT=1 node -e "require('./test/test-runner').runTests(['./test/build/seo.test.js'])" \
  | grep -E "❌|Results|<本批 slug 关键词>"
python3 -c "import xml.dom.minidom as m;m.parse('_site/feed.xml');m.parse('_site/sitemap.xml')"
```

`SEO_STRICT` 的通过标准是**本批页面 0 失败**；其余 ❌ 是待办 backlog，写进 PR 即可。
L3 快照只覆盖首页与最早一篇，改中段文章通常不失配；失配才跑
`UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"`。

### 7. 提交与 PR

只 `git add` 本批 14 个文件。PR 描述三件套：

1. 「标题改前→改后」表（每组 zh + en 两行）。
2. 「Unverified claims removed」逐篇：删了什么、为什么（来源怎么说）、补了什么带日期细节；
   末尾列「Not used」的来源与原因（晚于文章日期 / 404 / 无相关内容）。
3. 检查命令输出块，含改前门禁违规数。

`gh pr create --base main --head <branch>`，返回 URL。

## 验证

PR 描述里的命令块能原样复跑且结果一致；`gh pr view <n> --json title,url` 有值。

## 坑

- **URL 字符计入 160 字段落**（2026-09-18）：`check-ai-tells` 对 zh 段落数的是去空白后的全部字符，
  含 Markdown 链接的 URL。一段里放两条内链几乎必超 → 每条内链单独成段。
- **`a, b and c` 三连**（2026-09-18）：en 门禁抓 `x, y(,) and z`，包括名词（"cut, cloth and stitching"、
  "gray, navy, camel and you"）。改法：去 and 写成 `x, y, z`，或拆成两句。中文版不受影响。
- **em dash**：en 全篇 >2 个且 >3/千词就报。老文平均 3–7 个，重写时一律用句号或逗号；
  结尾引用块 `> "…" — Guushu` 的单个 `—` 不算（引用块不进门禁）。
- **description 长度反复超**（2026-09-18）：先用 `python3 -c "print(len('...'))"` 量好再替换；
  不要凭感觉改一版跑一版。zh 描述里每个拉丁词只算 0.5，可以多放品牌名，少放汉字。
- **批量替换把文件截成 0 字节**（2026-09-18）：`s.replace(old, None)` 之类会抛异常，
  但若在 `open(f,'w')` 之后才抛，文件已清空。规矩：先 `assert old in s` 且替换值非空，
  全部替换算完再一次性写回；替换后立刻 `wc -c` 或重跑长度脚本。
- **zsh 数组**：`for f in $F` 对空格分隔的字符串不拆词，门禁会报「cannot read <整串>」；
  用 `ZH=(a b c)` 数组。
- **姊妹文章已用过的细节不要复用**：crochet-craft 已用 Christopher Kane 2011 / Moschino 2024 /
  Vogue 2025-03 手工极简；quiet-luxury-explained 已用 The Row 2006 / Paltrow 2023 / WSJ 2024 / Eckhardt 2015。
  派研究 agent 时列出来，要求找别的。
- **Wikipedia 内部矛盾**：`Fashion_week` 总览页说 apex 只有三城，四个城市页都写 Big Four 含伦敦；
  引城市页。Pantone 年度色「第 N 个」按年数 27、按颜色 29（2016、2021 各两色），Vogue 又说 since 1999，
  这类序数直接删。
- **不得预写 / 不得翻译**：见 `docs/article-authoring-prompt.md` §5 与 `de-ai-copy-en` §0。
