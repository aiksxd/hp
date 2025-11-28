const { getCurrentWindow } = window.__TAURI__.window;

const appWindow = getCurrentWindow();
// global variable
let activeEditor = 0
let editorArray = [];
let nodeArray = [];
class NodeDataManager {
    constructor() {
        this.selectedNode = null;
        this.nodeCounter = 0;
    }
    
    // 添加新节点到nodeArray
    addNode(node, nodeType) {
        const nodeIndex = this.nodeCounter++;
        const nodeData = {
            id: `node_${nodeIndex}`,
            index: nodeIndex, // 存储索引
            type: nodeType,
            properties: {},
            inputs: {},
            outputs: {},
            customInputs: [],
            dynamicInputs: []
        };
        
        // 添加到全局nodeArray
        nodeArray[nodeIndex] = nodeData;
        node.customData = { 
            id: nodeData.id,
            index: nodeIndex // 在节点中也存储索引
        };
        
        console.log(`节点 ${nodeData.id} 已添加到索引 ${nodeIndex}`);
        return nodeData;
    }
    
    // 通过索引获取节点数据
    getNodeData(node) {
        if (!node.customData) return null;
        return nodeArray[node.customData.index];
    }
    
    // 通过索引更新节点属性
    updateNodeProperties(nodeIndex, newProperties) {
        if (nodeArray[nodeIndex]) {
            nodeArray[nodeIndex].properties = { 
                ...nodeArray[nodeIndex].properties, 
                ...newProperties 
            };
            console.log(`节点索引 ${nodeIndex} 属性已更新:`, newProperties);
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
        
        console.log(`动态输入 ${inputName} 已添加到节点索引 ${nodeData.index}`);
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
        
        console.log(`动态输入 ${inputName} 已从节点索引 ${nodeData.index} 移除`);
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
        console.log(`节点索引 ${nodeData.index} 的动态输入已更新`);
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
            index: nodeData.index, // 包含索引
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
        
        console.log('编辑器数据已更新，节点索引:', nodeData.index);
    }
    
    // 根据编辑器数据更新节点（通过索引直接访问）
    updateNodeFromEditorData(editorData) {
        const nodeIndex = editorData.index;
        
        console.log(editorData)
        console.log("editorData; index:")
        console.log(nodeIndex)
        console.log("index; Array:")
        console.log(nodeArray)
        if (!nodeArray[nodeIndex]) {
            console.warn('未找到对应的节点索引:', nodeIndex);
            return false;
        }
        
        const nodeData = nodeArray[nodeIndex];
        const graph = window.graph;
        if (!graph) {
            console.warn('未找到图形实例');
            return false;
        }
        
        // 通过索引查找节点
        const node = graph._nodes.find(n => 
            n.customData && n.customData.index === nodeIndex
        );
        
        if (!node) {
            console.warn('未找到对应的节点实例，索引:', nodeIndex);
            return false;
        }
        
        let updated = false;
        
        // 更新属性
        if (editorData.properties) {
            node.properties = { ...node.properties, ...editorData.properties };
            nodeData.properties = { ...nodeData.properties, ...editorData.properties };
            updated = true;
            console.log('节点属性已更新，索引:', nodeIndex);
        }
        
        // 更新动态输入
        if (editorData.dynamicInputs) {
            this.updateDynamicInputs(node, editorData.dynamicInputs);
            updated = true;
        }
        
        if (updated) {
            node.setDirtyCanvas(true);
            if (window.canvas) {
                window.canvas.dirty = true;
            }
        }
        
        return updated;
    }
    
    // 获取所有节点数据（调试用）
    getAllNodes() {
        return nodeArray.filter(Boolean); // 过滤掉空值
    }
    
    // 清理已删除的节点
    cleanupDeletedNodes() {
        // 这里可以添加逻辑来清理标记为删除的节点
        console.log('当前节点数量:', this.getAllNodes().length);
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
// 调试工具函数
window.debugNodes = {
    // 显示所有节点信息
    showAllNodes: function() {
        console.log('=== 所有节点信息 ===');
        nodeArray.forEach((node, index) => {
            if (node) {
                console.log(`[${index}] ${node.id}:`, {
                    type: node.type,
                    properties: node.properties,
                    dynamicInputs: node.dynamicInputs
                });
            }
        });
        console.log('=== 结束 ===');
    },
    
    // 获取节点数量
    getNodeCount: function() {
        return nodeArray.filter(Boolean).length;
    },
    
    // 通过索引获取节点
    getNodeByIndex: function(index) {
        return nodeArray[index];
    },
    
    // 查找节点
    findNode: function(predicate) {
        return nodeArray.find(predicate);
    }
};

// 在控制台中可以调用：
// debugNodes.showAllNodes()
// debugNodes.getNodeCount()