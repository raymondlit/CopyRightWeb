// web_app/script.js

const zipInput = document.getElementById('zipInput');
const scanBtn = document.getElementById('scanBtn');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const fileListEl = document.getElementById('fileList');

// early warning if running from file:// - font fetches will be blocked by CORS
if (location.protocol === 'file:') {
    statusEl.textContent = '警告：当前通过 file:// 打开页面，浏览器会阻止字体加载。请用 http/https 静态服务器（如 python -m http.server）访问。';
}

let currentFiles = []; // {name, content, lines}

zipInput.addEventListener('change', () => {
    if (zipInput.files.length) {
        scanBtn.disabled = false;
        statusEl.textContent = 'ZIP 已选择，点击“扫描并统计”。';
    } else {
        scanBtn.disabled = true;
        exportBtn.disabled = true;
        statusEl.textContent = '';
    }
});

scanBtn.addEventListener('click', async () => {
    const file = zipInput.files[0];
    statusEl.textContent = '解压中...';
    currentFiles = [];
    fileListEl.textContent = '';

    try {
        const zip = await JSZip.loadAsync(file);
        const exts = ['.py','.ts','.tsx','.js','.jsx','.java','.kt','.kts','.c','.cpp','.h','.hpp','.go','.rs','.swift','.cs','.php','.html','.htm','.css','.scss','.sass','.md','.json','.yml','.yaml','.sql','.sh','.ps1','.xml'];
        const entries = Object.values(zip.files).filter(f => !f.dir && exts.some(e=>f.name.toLowerCase().endsWith(e)));
        let totalLines = 0;
        for (let entry of entries) {
            const content = await entry.async('string');
            const lines = content.split(/\r?\n/).length;
            totalLines += lines;
            currentFiles.push({name: entry.name, content, lines});
            fileListEl.textContent += `${entry.name} : ${lines} 行\n`;
        }
        fileListEl.textContent += `\n总文件: ${entries.length} , 总行数: ${totalLines}`;
        statusEl.textContent = '扫描完成';
        exportBtn.disabled = false;
    } catch (e) {
        console.error(e);
        statusEl.textContent = '扫描失败：' + e;
    }
});

exportBtn.addEventListener('click', () => {
    if (!currentFiles.length) return;
    const { jsPDF } = window.jspdf;
    // try to load a Chinese-capable font from /fonts/; tries multiple common filenames
    async function tryLoadFont(doc) {
        // prefer non-variable fonts first; VF may produce incorrect glyph mappings in jsPDF
        const tryNames = [
            'NotoSansSC-Regular.ttf',
            'NotoSansSC.ttf',
            'NotoSansSC-Regular.otf',
            'NotoSansSC-VF.ttf'  // last resort
        ];
        // helper: convert ArrayBuffer to base64
        function arrayBufferToBase64(buffer) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
                const sub = bytes.subarray(i, i + chunk);
                binary += String.fromCharCode.apply(null, sub);
            }
            return btoa(binary);
        }

        for (let name of tryNames) {
            console.log('尝试载入字体', name);
            try {
                const url = `fonts/${name}`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.log('未找到', url, resp.status);
                    continue;
                }
                const buf = await resp.arrayBuffer();
                const b64 = arrayBufferToBase64(buf);
                const FONT_NAME = name.replace(/[^a-zA-Z0-9]/g, '_');
                doc.addFileToVFS(name, b64);
                try {
                    doc.addFont(name, FONT_NAME, 'normal');
                } catch (e) {
                    console.warn('addFont 过程出现异常', e);
                    try { doc.addFont(`${name}.ttf`, FONT_NAME, 'normal'); } catch (ee) { console.warn('第二次 addFont 失败', ee); }
                }
                // try setting font to detect errors
                try {
                    doc.setFont(FONT_NAME);
                    // draw a small sample off-page
                    doc.setFontSize(1);
                    doc.text('测试', -100, -100);
                } catch (e) {
                    console.warn('设置字体后出错，跳过', FONT_NAME, e);
                    continue;
                }
                console.log('字体加载成功', FONT_NAME);
                return FONT_NAME;
            } catch (e) {
                console.warn('尝试加载字体失败', name, e);
                continue;
            }
        }
        // If none loaded locally, try fetching a remote copy from a CDN
        const cdnUrls = [
            'https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/TTF/NotoSansSC-VF.ttf',
            'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/NotoSansSC-Regular.otf'
        ];
        for (let url of cdnUrls) {
            try {
                console.log('尝试从 CDN 下载字体', url);
                const resp = await fetch(url);
                if (!resp.ok) { console.log('CDN 字体下载失败', resp.status); continue; }
                const buf = await resp.arrayBuffer();
                const b64 = arrayBufferToBase64(buf);
                const name = url.split('/').pop();
                const FONT_NAME = name.replace(/[^a-zA-Z0-9]/g, '_');
                doc.addFileToVFS(name, b64);
                doc.addFont(name, FONT_NAME, 'normal');
                doc.setFont(FONT_NAME);
                console.log('成功从 CDN 加载字体', FONT_NAME);
                return FONT_NAME;
            } catch (e) {
                console.warn('从 CDN 下载字体出错', url, e);
                continue;
            }
        }
        if (location.protocol === 'file:') {
            statusEl.textContent = '未嵌入字体：若在本地打开，请使用静态服务器（例如 `python -m http.server`）或部署到 GitHub Pages。';
        }
        return null;
    }

    const doc = new jsPDF({unit:'pt',format:'a4'});
    const margin = 40;
    let y = margin;
    // Use slightly smaller font size with increased line height for readability
    const fontSize = 10; // points
    const lineHeight = 14; // points
    const pageHeight = doc.internal.pageSize.height;

    const addText = (text) => {
        const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - 2*margin);
        for (let l of lines) {
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(l, margin, y);
            y += lineHeight;
        }
    };

    (async () => {
        const loadedFont = await tryLoadFont(doc);
        if (loadedFont) {
            try { doc.setFont(loadedFont); } catch (e) { console.warn(e); }
        }
        // metadata
        doc.setFontSize(fontSize + 2);
        doc.text('项目代码导出', margin, y);
        y += lineHeight * 1.2;
        doc.setFontSize(fontSize);
        doc.text('生成时间: ' + new Date().toLocaleString(), margin, y);
        y += lineHeight * 1.5;

        for (let f of currentFiles) {
            // file header using the same font (should display Chinese if any)
            doc.setFontSize(fontSize + 1);
            if (y + lineHeight > pageHeight - margin) { doc.addPage(); y = margin; }
            doc.text('文件: ' + f.name, margin, y);
            y += lineHeight * 1.2;
            doc.setFontSize(fontSize);
            if (y + lineHeight > pageHeight - margin) { doc.addPage(); y = margin; }
            doc.text('----------------------------------------', margin, y);
            y += lineHeight;

            // content (font already set)
            if (y + lineHeight > pageHeight - margin) { doc.addPage(); y = margin; }
            addText(f.content);
            y += lineHeight; // small gap after content
        }

        doc.save('code_export.pdf');
        statusEl.textContent = 'PDF 下载完成';
    })();
});
