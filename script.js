// web_app/script.js

const zipInput = document.getElementById('zipInput');
const scanBtn = document.getElementById('scanBtn');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const fileListEl = document.getElementById('fileList');

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
    const doc = new jsPDF({unit:'pt',format:'a4'});
    const margin = 40;
    let y = margin;
    const lineHeight = 12;
    const pageHeight = doc.internal.pageSize.height;

    const addText = (text, opts={}) => {
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
    addText('项目代码导出', {size:16});
    addText('生成时间: ' + new Date().toLocaleString());
    addText('');
    for (let f of currentFiles) {
        addText('文件: ' + f.name);
        addText('----------------------------------------');
        addText(f.content);
        addText('');
    }
    doc.save('code_export.pdf');
    statusEl.textContent = 'PDF 下载完成';
});
