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
    
    // 添加新节点到nodeArray
    addNode(node, nodeType) {
        const nodeId = `node_${this.nodeCounter++}`;
        const nodeData = {
            id: nodeId,
            type: nodeType,
            properties: {},
            inputs: {},
            outputs: {},
            customInputs: [],
            dynamicInputs: []
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
    
    // 动态添加输入
    addDynamicInput(node, inputName, inputType = "number") {
        const nodeData = this.getNodeData(node);
        if (!nodeData) return false;
        
        // 检查是否已存在
        if (nodeData.dynamicInputs.find(input => input.name === inputName)) {
            console.warn(`输入 ${inputName} 已存在`);
            return false;
        }
        
        const newInput = { name: inputName, type: inputType };
        nodeData.dynamicInputs.push(newInput);
        node.addInput(inputName, inputType);
        
        console.log(`动态输入 ${inputName} 已添加到节点 ${nodeData.id}`);
        return true;
    }
    
    // 移除动态输入
    removeDynamicInput(node, inputName) {
        const nodeData = this.getNodeData(node);
        if (!nodeData) return false;
        
        nodeData.dynamicInputs = nodeData.dynamicInputs.filter(
            input => input.name !== inputName
        );
        node.removeInput(inputName);
        
        console.log(`动态输入 ${inputName} 已从节点 ${nodeData.id} 移除`);
        return true;
    }
    
    // 更新动态输入
    updateDynamicInputs(node, newInputs) {
        const nodeData = this.getNodeData(node);
        if (!nodeData) return false;
        
        const currentInputs = nodeData.dynamicInputs || [];
        
        // 找出差异
        const inputsToRemove = currentInputs.filter(
            current => !newInputs.find(newInput => newInput.name === current.name)
        );
        
        const inputsToAdd = newInputs.filter(
            newInput => !currentInputs.find(current => current.name === newInput.name)
        );
        
        // 执行更新
        inputsToRemove.forEach(input => {
            this.removeDynamicInput(node, input.name);
        });
        
        inputsToAdd.forEach(input => {
            this.addDynamicInput(node, input.name, input.type);
        });
        
        nodeData.dynamicInputs = [...newInputs];
        console.log(`节点 ${nodeData.id} 的动态输入已更新`);
        return true;
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
            customInputs: nodeData.customInputs,
            dynamicInputs: nodeData.dynamicInputs,
            _nodeConfig: true,
            _timestamp: new Date().toISOString()
        };
        
        const event = new CustomEvent('nodeSelected', { 
            detail: editorData 
        });
        document.dispatchEvent(event);
        
        console.log('编辑器数据已更新:', editorData);
    }
    
    // 根据编辑器数据更新节点
    updateNodeFromEditorData(editorData) {
        let node = this.nodes.get(editorData.nodeId);
        
        // console.log("editorData:")
        // console.log(editorData)
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
            console.log('节点属性已更新:', node);
            updated = true;
        }
        
        // 更新动态输入
        if (editorData.dynamicInputs) {
            this.updateDynamicInputs(node, editorData.dynamicInputs);
            updated = true;
        }
        
        // if (updated) {
        //     // 强制重绘
        //     if (window.canvas) {
        //         window.canvas.dirty = true;
        //         // 使用 setTimeout 确保重绘在浏览器下一帧执行，避免潜在的性能问题
        //         setTimeout(() => {
        //             window.canvas.draw(true, true);
        //         }, 0);
        //     }
            
        //     // 触发属性变化事件
        //     if (node.onPropertyChanged) {
        //         Object.keys(editorData.properties || {}).forEach(key => {
        //             node.onPropertyChanged(key, editorData.properties[key]);
        //         });
        //     }
        // }
        
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

    // 切换编辑器模式
    switchToCodeMode(node) {
        const nodeData = this.getNodeData(node);
        if (!nodeData) return;
        
        const savedCode = this.getNodeCode(nodeData.id);
        const codeContent = savedCode ? savedCode.code : this.generateDefaultCode(nodeData);
        
        editorCommManager.updateMonacoEditor(codeContent, 'code');
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