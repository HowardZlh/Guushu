---
name: splash-images
description: >-
  Use whenever a Guushu article/page needs a hero or in-body image, or when an
  existing image is wrong/unrelated and must be replaced. Covers searching the
  Unsplash API, downloading candidates, visually verifying content match,
  de-duplicating across posts, registering the photo id in
  scripts/image-sources.json, generating the self-hosted 1200x630 JPEG with
  scripts/make_images.py, and wiring the local /assets/img/ path into the
  markdown front matter + body. Trigger on tasks like "配图不相符/替换配图",
  "add an image", "find a photo for this article", "og:image 404".
allowed-tools:
  - read
  - grep
  - glob
  - bash
  - edit
triggers:
  - user
  - model
---

# Guushu 配图助手（Unsplash 选图 → 自托管）

Guushu 站点的所有配图都是**仓库内自托管的 JPEG**，路径形如
`/assets/img/posts/<slug>.jpg`（1200×630，og:image 尺寸），同一路径同时用于
og:image / twitter:image / JSON-LD、列表卡片和正文中部的 `![alt](path)`。
Unsplash 只在**编辑期选图**时用到：photo id 登记在 `scripts/image-sources.json`，
`scripts/make_images.py` 据此下载、裁切并写入 `assets/img/`；构建（`build.py`、CI）
不再访问任何第三方图片服务。`build.py` 会校验 `image:` 指向的文件存在，否则构建失败。

因此"配图"工作 = **用 Unsplash API 搜到合适的图 → 下载看图确认 → 登记 id 并生成
本地 JPEG → 把 `/assets/img/posts/<slug>.jpg` 写进 md**。

目录约定：

| 路径 | 内容 | 生成方式 |
|---|---|---|
| `assets/img/posts/<slug>.jpg` | 文章主图，中英镜像共用（slug 同名） | `posts` 段，1200×630 居中裁切 |
| `assets/img/pages/<name>.jpg` | 手写页插图（首页品牌故事、fashion-news 卡片） | `pages` 段，按 `width` 等比缩放 |
| `assets/img/og-default.jpg` | 非文章页的默认社交卡片图 | `og_default` 段，1200×630 |

脚本依赖 Pillow（`python3 -m pip install Pillow`，本机系统 `python3` 已有；不要加进
`requirements.txt`，CI 不需要）。

## 凭据

Unsplash API 凭据（Access Key / Client-ID）：

```
Application ID: 993854
Access Key:     NkKT_saNa_iayiXwuFWqOTEx77bzoKNj4sOPsN3ZdYE
```

调用时放到请求头：`Authorization: Client-ID <Access Key>`。

> ⚠️ 这是公开演示用的 demo key，速率有限（约 50 次/小时）。不要泄露到构建产物或
> 前端代码里；它只用于**编辑期离线选图**。写进 md 的永远是本地路径，写进
> `scripts/image-sources.json` 的只有 `photo-<ID>` 段，都不含 key。

## 硬性原则

1. **配图必须与内容相符。** 绝不能凭图片 ID 猜内容——每张候选图都要**下载后用
   Read 工具实际查看**，确认主体（人物着装 / 工艺细节 / 色调 / 单品类型）与文章
   主题一致，不匹配就换。
2. **配图不得跨文章重复。** 每篇文章一张唯一主图（中英镜像共用同一个文件）。
   去重看 `scripts/image-sources.json` 里的 photo id 是否重复。
3. **front matter 与正文同图。** `image:` 与正文 `![]()` 用同一个本地路径。
4. **md 里只写本地路径** `/assets/img/posts/<slug>.jpg`，不要再写 `images.unsplash.com`
   直链（L2 测试会拦截任何页面里残留的 Unsplash 热链）。
5. **Unsplash 来源必须登记。** 每个自托管文件在 `scripts/image-sources.json` 里都有
   对应的 `photo-<ID>`，这是重生成和日后署名的唯一依据。

## 工作流

### 1. 搜索候选图（Unsplash Search API）

```bash
ACCESS_KEY="NkKT_saNa_iayiXwuFWqOTEx77bzoKNj4sOPsN3ZdYE"
curl -s "https://api.unsplash.com/search/photos?query=pleated%20skirt%20fashion&per_page=8&orientation=landscape" \
  -H "Authorization: Client-ID $ACCESS_KEY" \
| python3 -c "import sys,json;d=json.load(sys.stdin);[print(r['id'],'|',r.get('alt_description')) for r in d['results']]"
```

搜索建议：
- 用**具体、贴合文章主题**的英文关键词（如 `accordion pleated dress`、
  `quiet luxury outfit`、`crochet knit summer`、`sequin party dress`）。
- `orientation=landscape` 更适合作 hero 图。
- `alt_description` 只是线索，**不能替代看图**。

### 2. 下载并看图验证（每张都要做）

临时目录已预授权：

```bash
cd /var/folders/ys/_2dk9x8504l1hmv_17g03bww0000gp/T/opencode
mkdir -p imgcheck && cd imgcheck

# 用上一步得到的 <ID> 拼稳定直链下载缩略图
curl -s -o cand.jpg "https://images.unsplash.com/photo-<ID>?w=400"
```

然后用 **Read 工具打开 `cand.jpg`**，肉眼确认与文章主题相符。

> 注意：Unsplash 的 photo id 有两种——`id`（短码，如 `QY0qR938qL8`）和直链里的
> `photo-<ID>` 数字段（如 `1551084804-4b60b3c10f9e`）。直链要用后者。若只拿到短码，
> 调 `GET https://api.unsplash.com/photos/<shortcode>` 从返回的 `urls.small` 里取出
> `photo-...` 段。

### 3. 去重检查（跨文章不得重复）

```bash
cd /Users/steve/WebstormProjects/Guushu
grep -n "<ID>" scripts/image-sources.json        # 应无输出：新图未被其它文章使用
python3 - <<'PY'
import json, collections
m = json.load(open("scripts/image-sources.json"))
seen = collections.defaultdict(list)
for slug, pid in m["posts"].items():
    seen[pid].append(slug)
for pid, slugs in seen.items():
    if len(slugs) > 1:
        print("跨文章重复:", pid, slugs)
PY
```

### 4. 登记来源并生成本地图

在 `scripts/image-sources.json` 的 `posts` 段加一行（新文章）或改 id（替换配图）：

```json
"<slug>": "photo-<ID>"
```

然后生成（替换时加 `--force` 覆盖旧文件）：

```bash
python3 scripts/make_images.py --only <slug> [--force]
```

产物 `assets/img/posts/<slug>.jpg`（1200×630，约 50–190 KB）。**用 Read 工具再看一眼
裁切结果**——居中裁切偶尔会切掉主体，不行就换一张构图更居中的图。

手写页插图 / 默认 og 图同理，改 `pages` / `og_default` 段后 `--only <name>` 或
`--only og-default`。

### 5. 写进 markdown（中 + 英两个文件）

同一张图要同时更新中文与英文镜像文件的**两处**：front matter `image:` 与正文 `![]()`。

- `_posts/YYYY-MM-DD-slug.md`
- `en/_posts/YYYY-MM-DD-slug.md`

```yaml
image: "/assets/img/posts/<slug>.jpg"
```
```markdown
![贴合内容的中文/英文 alt](/assets/img/posts/<slug>.jpg)
```

### 6. 构建与测试

```bash
python3 build.py
node test/run-all.js
python3 build.py && node test/run-build.js
```

`build.py` 在 `image:` 指向的文件不存在时会直接退出（`image not found in repo`），
说明第 4 步漏跑或 slug 拼错。L2 `build-output.test.js` 会检查每个页面的 og:image 是
`https://fashion.guushu.com/assets/img/...jpg` 且文件确实在 `_site/` 里，并拒绝任何
残留的 `images.unsplash.com`。

若首页"最新文章"列表因内容变化导致 L3 快照失配（预期变更）：

```bash
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"
```

提交时把 `assets/img/posts/<slug>.jpg`、`scripts/image-sources.json` 和两个 md 一起放进
同一个 PR。

## 备用图源

Unsplash 命不中时，可用 **Wikimedia Commons**（内容明确、URL 稳定，适合工艺/实物/历史图）：

```bash
curl -s -L -A "Mozilla/5.0" -o cand.jpg \
  "https://commons.wikimedia.org/wiki/Special:FilePath/<File_Name>.jpg?width=800"
```

（Commons 的 `upload.wikimedia.org/.../thumb/<hash>/...` 直链需要 MD5 哈希前缀，
无法凭空构造，请用上面的 `Special:FilePath` 接口。）

`make_images.py` 目前只认 Unsplash photo id；Commons 图请手动下载 1600 宽原图后用
Pillow `ImageOps.fit(img, (1200, 630))` 裁切，存到同样的路径，并在
`scripts/image-sources.json` 里以 `"<slug>": "commons:<File_Name>.jpg"` 记录来源
（脚本遇到非 `photo-` 前缀会报错跳过，不会覆盖手工文件）。

## 相关文档 / Skill

- 完整文章编写规范见 `docs/article-authoring-prompt.md`（§6 即配图工作流的原始版本，
  本 skill 是其"用真实 API 选图"的增强版）。
- Git 工作流见 `AGENTS.md` 与 `git` skill：改完图走 feature 分支 + PR，绝不直推 `main`。
