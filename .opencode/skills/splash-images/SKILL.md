---
name: splash-images
description: >-
  Use whenever a Guushu article/page needs a hero or in-body image, or when an
  existing image is wrong/unrelated and must be replaced. Covers searching the
  Unsplash API, downloading candidates, visually verifying content match,
  de-duplicating across posts, and wiring the URL into the markdown front
  matter + body. Trigger on tasks like "配图不相符/替换配图", "add an image",
  "find a photo for this article".
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

# Guushu 配图助手（Unsplash API）

Guushu 站点的所有配图都是 **Unsplash 直链热链**，硬编码在文章的 front matter
`image:` 字段和正文中部的 `![alt](url)` 里（两者必须是同一张图）。本项目并没有
运行时/构建时的图片 API 调用——`build.py` 只是把 URL 字符串透传给模板。

因此"配图"工作 = **用 Unsplash API 搜到合适的图 → 下载看图确认 → 把直链写进 md**。

## 凭据

Unsplash API 凭据（Access Key / Client-ID）：

```
Application ID: 993854
Access Key:     NkKT_saNa_iayiXwuFWqOTEx77bzoKNj4sOPsN3ZdYE
```

调用时放到请求头：`Authorization: Client-ID <Access Key>`。

> ⚠️ 这是公开演示用的 demo key，速率有限（约 50 次/小时）。不要泄露到构建产物或
> 前端代码里；它只用于**编辑期离线选图**，最终写进 md 的永远是 `images.unsplash.com`
> 的静态直链，不含 key。

## 硬性原则

1. **配图必须与内容相符。** 绝不能凭图片 ID 猜内容——每张候选图都要**下载后用
   Read 工具实际查看**，确认主体（人物着装 / 工艺细节 / 色调 / 单品类型）与文章
   主题一致，不匹配就换。
2. **配图不得跨文章重复。** 每篇文章一张唯一主图（中英镜像共用同一张属正常，应出现 x2）。
3. **front matter 与正文同图。** `image:` 与正文 `![]()` 用同一个 URL。
4. **写进 md 的 URL 用稳定直链格式**：`https://images.unsplash.com/photo-<ID>?w=800`
   （不要写带 `ixid`/`crop`/`q` 等一次性查询参数的 `urls.raw/regular` 长链）。

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
python3 - <<'PY'
import re, glob, collections
urls=collections.defaultdict(list)
for f in glob.glob("_posts/*.md")+glob.glob("en/_posts/*.md"):
    for m in re.finditer(r'image: "([^"]+)"', open(f,encoding="utf-8").read()):
        urls[m.group(1).split("?")[0]].append(f)
for u,fs in sorted(urls.items()):
    slugs={re.sub(r'^(en/)?_posts/','',x).replace('.md','') for x in fs}
    print(f"{u.split('/')[-1]:55} x{len(fs)}", "<-- 跨文章重复!" if len(slugs)>1 else "")
PY
```

选定的新图应确认**未在任何其它文章出现过**（可先 `grep -rn "<ID>" _posts/ en/_posts/`）。

### 4. 写进 markdown（中 + 英两个文件）

同一张图要同时更新中文与英文镜像文件的**两处**：front matter `image:` 与正文 `![]()`。

- `_posts/YYYY-MM-DD-slug.md`
- `en/_posts/YYYY-MM-DD-slug.md`

```yaml
image: "https://images.unsplash.com/photo-<ID>?w=800"
```
```markdown
![贴合内容的中文/英文 alt](https://images.unsplash.com/photo-<ID>?w=800)
```

### 5. 构建与测试

```bash
python3 build.py
node test/run-all.js
python3 build.py && node test/run-build.js
```

若首页"最新文章"列表因内容变化导致 L3 快照失配（预期变更）：

```bash
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"
```

## 备用图源

Unsplash 命不中时，可用 **Wikimedia Commons**（内容明确、URL 稳定，适合工艺/实物/历史图）：

```bash
curl -s -L -A "Mozilla/5.0" -o cand.jpg \
  "https://commons.wikimedia.org/wiki/Special:FilePath/<File_Name>.jpg?width=800"
```

（Commons 的 `upload.wikimedia.org/.../thumb/<hash>/...` 直链需要 MD5 哈希前缀，
无法凭空构造，请用上面的 `Special:FilePath` 接口。）

## 相关文档 / Skill

- 完整文章编写规范见 `docs/article-authoring-prompt.md`（§6 即配图工作流的原始版本，
  本 skill 是其"用真实 API 选图"的增强版）。
- Git 工作流见 `AGENTS.md` 与 `git` skill：改完图走 feature 分支 + PR，绝不直推 `main`。
