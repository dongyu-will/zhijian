---
title: 我的第一本 Markdown 书
---

# 我的第一本 Markdown 书

用一两句话说明这本书写给谁，以及它帮助读者解决什么问题。

## 目录

1. [介绍](chapters/01-introduction.md)
2. [内容形式示例](chapters/02-example.md)

## 使用这个模板

1. 修改本页的书名和简介。
2. 参考第二章展示的内容形式，替换 `chapters/` 中的示例正文；也可以按照内容需要增删目录。
3. 建议检查一级标题、相对链接和图片路径。
4. 在阅读器项目中运行 `npm run validate:repository -- /path/to/repository`，查看兼容性警告。
5. 将仓库公开发布到 GitHub，并在阅读器项目的 `catalog/books/` 中登记书名、作者和仓库地址。

根目录 `README.md` 会优先作为整本书的入口；缺少时，阅读器会使用路径排序后的第一篇 Markdown。其他 Markdown 文件会被递归发现，因此不必采用固定的章节结构。
