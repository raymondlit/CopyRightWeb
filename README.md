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

### 字体支持

为了正确渲染中文，仓库已在 `web_app/fonts/` 目录包含开源字体 **Noto Sans SC**。由于一些浏览器和 jsPDF 对**可变字体（Variable Font，VF）**支持不佳，当前目录中最好含有一个普通静态字体，比如 `NotoSansSC-Regular.ttf`。

`script.js` 会尝试依次加载以下文件：

```text
NotoSansSC-Regular.ttf
NotoSansSC.ttf
NotoSansSC-Regular.otf
NotoSansSC-VF.ttf   # 仅在其他文件缺失时使用
```

如若仅有 VF 文件，jsPDF 可能无法正确映射中文字符，从而出现乱码。若遇到输出依旧怪异，请替换成或下载一个静态版本。

> **重要**：若直接通过 `file://` 打开，浏览器的同源策略会阻止对 `fonts/` 目录的访问（CORS 错误），导致字体无法加载并出现乱码。请通过本地静态服务器（例如 `python -m http.server`、`npx serve` 等）或部署至 GitHub Pages 才能正常运行。

### 故障排查

脚本内部会在控制台打印加载过程的日志，包括每个尝试的字体名及可能的错误。若在生成 PDF 时出现乱码，请打开浏览器开发者工具查看相关消息，以便确定哪个文件被加载以及是否发生注册错误。
