# 参与贡献

欢迎修正文字、公式和阅读体验，也欢迎整理其他形式的资料。

## 运行与验证

```sh
npm ci
npm run dev
npm run verify
```

使用 Node.js 22.12 或更新版本。界面改动请检查桌面和手机宽度；代码约定见 [code-style.md](docs/agents/code-style.md)。

## 修正首发内容

数学一和数学二整理文本分别位于 `content/math-one-exams/`、`content/math-two-exams/`。请直接修改对应年份 Markdown，在 PR 中说明年份、题号、修正依据。不要根据猜测补写原题或答案。

题目引用的配图随正文维护，原 PDF 暂不公开，不要加入贡献。代码采用 Apache-2.0；内容的权利说明见 [`content/README.md`](content/README.md)。

## 添加其他资料

普通 UTF-8 Markdown 即可。单篇文档、书籍、讲义或教程均可，不要求固定目录、题号、标题层级或元数据。`README.md`、`SUMMARY.md` 和短导航标题只是可选辅助。源码示例在 [`examples/book-repository/`](examples/book-repository/)，完整边界见[最小兼容约定](docs/repository-standard-v1.md)。

先确认资料的公开传播权限并保留来源。本项目内维护的正文放入独立的 `content/` 子目录，并在 `src/data/book-data.ts` 登记。外部公开 GitHub 资料则在 `catalog/books/` 添加 YAML，例如：

```yaml
title: 示例讲义
author: 示例作者
repository: https://github.com/example/notes
rootDirectory: books/calculus
```

文件名是稳定标识；`rootDirectory` 可省略，默认读取仓库根目录。一个仓库的多份资料分别登记。网站把外部仓库当作数据读取，不执行其中的脚本，也不跟随符号链接。

```sh
npm run validate:repository -- /path/to/material
npm run validate:catalog
npm run verify
```

新增资料时同步调整首发产物检查中的预期范围；这是本站当前发布范围的检查，不是对资料格式的限制。

## 提交 PR

说明改动和验证结果即可。保留无关改动，不提交 `tmp/`、`.scratch/`、`dist/`、依赖目录、凭据或未获准公开的原始资料。修改界面时附上必要的效果截图。
