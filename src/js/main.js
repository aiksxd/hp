const { getCurrentWindow } = window.__TAURI__.window;

const appWindow = getCurrentWindow();
// global variable
let activeEditor = 0
let editorArray = [];

class NodeDataManager {
    constructor() {
        this.nodes = new Map();
        this.nodeCodeStorage = new Map();
        this.selectedNode = null;
        this.nodeCounter = 0;
    }
    
    addNode(node, nodeType) {
        const nodeId = `node_${this.nodeCounter++}`;
        const nodeData = {
            id: nodeId,
            type: nodeType,
            properties: {},
            inputs: {},
            outputs: {}
        };
        
        this.nodes.set(nodeId, nodeData);
        node.customData = { 
            id: nodeId
        };
        
        console.log(`节点 ${nodeId} 已添加`);
        return nodeData;
    }
    
    getNodeData(node) {
        if (!node.customData) return null;
        return this.nodes.get(node.customData.id);
    }
    
    // 通过索引更新节点属性
    updateNodeProperties(nodeId, newProperties) {
        const nodeData = this.nodes.get(nodeId);
        if (nodeData) {
            nodeData.properties = { 
                ...nodeData.properties, 
                ...newProperties 
            };
            console.log(`节点 ${nodeId} 属性已更新:`, newProperties);
            return true;
        }
        return false;
    }
    
    setSelectedNode(node) {
        this.selectedNode = node;
        const nodeData = this.getNodeData(node);
        
        if (nodeData) {
            this.notifyEditorUpdate(nodeData);
        }
    }
    
    notifyEditorUpdate(nodeData) {
        const editorData = {
            id: nodeData.id,
            type: nodeData.type,
            properties: nodeData.properties,
            inputs: nodeData.inputs,
            outputs: nodeData.outputs,
        };
        
        const event = new CustomEvent('nodeSelected', { 
            detail: editorData 
        });
        document.dispatchEvent(event);
        
        // console.log('编辑器数据已更新:', editorData);
    }
    
    // 根据编辑器数据更新节点
    updateNodeFromEditorData(editorData) {
        let node = this.nodes.get(editorData.nodeId);
        
        if (!node) {
            console.warn('未找到对应的节点id', editorData.nodeId);
            return false;
        }
        
        if (!window.graph) {
            console.warn('未找到图形实例');
            return false;
        }
        
        let updated = false;
        
        // 更新属性
        if (editorData) {
            Object.assign(node, editorData);
            // console.log('节点属性已更新:', node);
            updated = true;
        }
        return updated;
    }
    // 保存节点代码
    saveNodeCode(nodeId, code, language) {
        this.nodeCodeStorage.set(`${nodeId}_code`, {
            code,
            language,
            lastModified: new Date().toISOString()
        });
        console.log(`节点 ${nodeId} 的代码已保存`);
    }
    
    // 获取节点代码
    getNodeCode(nodeId) {
        return this.nodeCodeStorage.get(`${nodeId}_code`);
    }
    
    // 获取所有节点数据
    getAllNodes() {
        return nodeArray.filter(Boolean);
    }

    // 序列化所有节点数据（用于导出）
    serializeAllNodes() {
        return this.getAllNodes().map(nodeData => ({
            ...nodeData,
            // 确保属性是可序列化的
            properties: JSON.parse(JSON.stringify(nodeData.properties))
        }));
    }

}

// 全局节点管理器
const nodeManager = new NodeDataManager();

// 为最小化按钮绑定事件
document.getElementById('titlebar-minimize').addEventListener('click', () => {
    appWindow.minimize();
});

// 为最大化/还原按钮绑定事件
document.getElementById('titlebar-maximize').addEventListener('click', () => {
    appWindow.toggleMaximize();
});

// 为关闭按钮绑定事件
document.getElementById('titlebar-close').addEventListener('click', () => {
    appWindow.close();
});