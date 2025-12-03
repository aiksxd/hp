const { open, save } = window.__TAURI__.dialog;
const { readFile, writeFile } = window.__TAURI__.fs;
let targetPath, sourcePath, rememberedFileName = undefined;
// 导出图数据
async function exportGraph() {
    let graphData = window.graph.serialize();
    const encoder = new TextEncoder();
    graphData = JSON.stringify(graphData, null, 2);
    graphData = encoder.encode(graphData);

    if (!targetPath) {
        targetPath = await save({
            title: 'save as',
            filters: [{
                name: 'file',
                extensions: ['json']
            }],
            defaultPath: `${rememberedFileName}`
        });
    }
    if (!targetPath) {
        return;
    }
    rememberedFileName = targetPath.split(/[\\/]/).pop()
    try {
        await writeFile(targetPath, graphData);
        showHint('save successfully\n'+targetPath);
    } catch (error) {
        console.error('Save failed:', error);
        showHint('!!!SAVE FAILED!!!');
        throw new Error(`Save failed: ${error.message}`);
    }
}

// 从JSON字符串导入图数据
async function importGraph() {
    try {
        sourcePath = await open({
            multiple: false,
            directory: false,
            title: 'open',
            filters: [{
                name: rememberedFileName || 'file',
                extensions: ['json']
            }]
        });

        if (!sourcePath) {
            return;
        }
        targetPath = sourcePath;
        rememberedFileName = sourcePath.split(/[\\/]/).pop()
        // 因为我们设置了 multiple: false，所以这里直接使用
        let graphData = await readFile(sourcePath);
        const decoder = new TextDecoder();
        graphData = decoder.decode(graphData);
        graphData = JSON.parse(graphData);
        // 清空现有图
        window.graph.clear();

        window.graph.configure(graphData);
        showHint('Import Successfully');

    } catch (error) {
        console.error('导入失败:', error);
        throw new Error(`导入失败: ${error.message}`);
    }
}