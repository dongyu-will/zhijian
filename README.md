# Studyloom · 公共资料库

**串联各书的知识，建立自己的理解。**

Studyloom 希望让读者从一个知识点出发，找到不同书籍中的解释、例题和应用，看见它们之间的对应与互补。书籍保留完整阅读体验，知识点逐步成为连接不同资料的线索。

目前先做好资料整理与全文阅读，跨书知识点关联尚未实现，是后续建设方向。从数学开始，逐步容纳文章、书籍、讲义、教程等内容，不要求固定的章节结构。

首发收录 **2010–2026 年数学一、数学二真题整理文本**，各 17 份试卷。提供整理文本和题目配图，原 PDF 暂不公开。内容来自 OCR 整理，尚未完成逐题校对。

## 当前功能

- 资料目录、名称搜索与排序。
- 目录导航、书内搜索、公式和 Markdown 阅读。
- 阅读设置、同一浏览器内继续阅读。
- 查看 Markdown 与 GitHub 源文件，提交纠错。

## 本地运行

使用 Node.js 22.12 或更新版本：

```sh
npm ci
npm run dev
```

打开终端提示的地址，默认是 `http://localhost:4321/`。首发资料随源码提供，不需要 OCR 服务、环境密钥或外部资料仓库即可运行。

```sh
npm run verify       # 类型检查、测试、目录校验、静态构建及首发产物检查
npm run preview      # 预览 dist/，默认访问 /studyloom/
```

默认生产路径为 `/studyloom/`。自定义域名或其他托管路径可以通过 `PUBLIC_BASE_PATH` 和 `PUBLIC_SITE_URL` 配置；例如部署在域名根路径：

```sh
PUBLIC_BASE_PATH=/ PUBLIC_SITE_URL=https://your-domain.example npm run build
```

只部署 `dist/`。首发部署步骤见[发布说明](docs/release.md)，更多说明见[文档导航](docs/README.md)。

## 参与整理

首发正文在 [`content/`](content/README.md)。可直接修改对应年份的 Markdown，再提交 PR；请注明题号，尤其留意公式和配图。

后续资料可以是单篇文档，也可以自由组织成书籍、讲义或教程。目录、短标题和其他辅助信息均为可选。模板保留在 [`examples/book-repository/`](examples/book-repository/)，作为源码示例，不进入正式阅读目录。

网站仍支持通过 `catalog/books/*.yaml` 收录外部公开 GitHub 资料，首发暂未启用。具体方法见[贡献指南](CONTRIBUTING.md)与[最小兼容约定](docs/repository-standard-v1.md)。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `content/` | 已确认可公开的首发整理文本 |
| `catalog/books/` | 可选的外部资料收录配置 |
| `src/` | Astro 页面、阅读器、Markdown 处理 |
| `tests/` | 内容处理、构建与交互逻辑测试 |
| `examples/` | 可复制的 Markdown 示例 |
| `docs/` | 贡献约定与发布说明 |

原 PDF、未引用的配图、OCR 中间结果、设计检查记录与构建缓存保留在忽略目录中，不随源码发布。OCR 工具独立于网站维护，不参与构建。

## 许可证

项目代码采用 [Apache License 2.0](LICENSE)。试题、整理文本及其他第三方资料不自动继承代码许可证，详见[内容来源与权利说明](content/README.md)。
