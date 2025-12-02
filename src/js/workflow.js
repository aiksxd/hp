// 导出图数据为JSON字符串
function exportGraph() {
    const graphData = window.graph.serialize();
    
    // 转换为格式化JSON
    return JSON.stringify(graphData, null, 2);
}

// 从JSON字符串导入图数据
function importGraph(jsonData) {
    if (!jsonData || typeof jsonData !== 'string') {
        throw new Error('需要有效的JSON字符串');
    }
    
    try {
        // 解析JSON数据
        const graphData = JSON.parse(jsonData);
        
        // 清空现有图
        window.graph.clear();
        
        // 核心：配置图数据
        window.graph.configure(graphData);
        
        return true;
    } catch (error) {
        console.error('导入失败:', error);
        throw new Error(`导入失败: ${error.message}`);
    }
}