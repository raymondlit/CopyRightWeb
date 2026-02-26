# 软著申报助手 Web 版

这是《软著申报助手》桌面应用程序的 Web 版本，基于前端技术实现，适合部署在 GitHub Pages 或任何静态网站托管服务。

## 功能

1. 上传包含源码的 ZIP 文件。
2. 在浏览器中解压、统计指定扩展名的代码行数。
3. 显示每个文件的行数和总行数。
4. 将全部代码内容导出为 PDF 文档。

## 使用说明

1. 将此目录 (`web_app/`) 的内容推送到 GitHub 仓库的 `gh-pages` 分支，或者在 `Settings > Pages` 中指定 `main`/`master` 分支的 `web_app` 文件夹作为源。
2. 页面将通过 `index.html` 访问。
3. 打开网页，选择本地 ZIP 文件，点击“扫描并统计”，待完成后点击“导出为 PDF”。

## 技术栈

- HTML/CSS/JavaScript
- [JSZip](https://stuk.github.io/jszip/) 用于在浏览器中解压 ZIP。
- [jsPDF](https://github.com/parallax/jsPDF) 用于生成 PDF。

## 部署示例

```bash
# 在仓库根目录执行
git subtree push --prefix web_app origin gh-pages
```

或者直接将 `web_app` 的内容复制到 `gh-pages` 分支。

## 注意事项

- 所有操作均在客户端完成，无需后端支持。
- 支持的文件类型在 `script.js` 中指定，可根据需要扩展。
- PDF 生成可能在大型项目下耗时，取决于浏览器性能。
