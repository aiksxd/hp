// workflow.js - 简化的版本
// LiteGraph 集成
function initializeLiteGraph() {
    function registerFunctionFromString(functionName, functionString) {
        try {
            const dynamicFunction = new Function('return ' + functionString)();
            window[functionName] = dynamicFunction;
            
            const functionRegistry = window.functionRegistry || {};
            functionRegistry[functionName] = dynamicFunction;
            window.functionRegistry = functionRegistry;
            
            console.log(`函数 ${functionName} 注册成功`);
            return dynamicFunction;
        } catch (error) {
            console.error('函数注册失败:', error);
            return null;
        }
    }

    // 自定义节点类型
    function MyAddNode() {
        this.addInput("A", "number");
        this.addInput("B", "number");
        this.addOutput("A+B", "number");
        this.properties = { 
            precision: 1,
            description: "加法节点"
        };

        // 注册到节点管理器
        const nodeData = nodeManager.addNode(this, "basic/sum");

        // 初始化节点数据
        nodeData.inputs = {
            "A": "number",
            "B": "number"
        };
        nodeData.outputs = {
            "A+B": "number"
        };
        
        nodeData.dynamicInputs = [];
    }

    MyAddNode.title = "Sum";
    
    MyAddNode.prototype.onExecute = function() {
        let sum = 0;
        
        // 计算所有输入的总和（包括动态输入）
        for (let i = 0; i < this.inputs.length; i++) {
            const value = this.getInputData(i);
            if (value !== undefined && value !== null) {
                sum += value;
            }
        }
        
        // 使用精度设置
        const precision = this.properties.precision || 1;
        const roundedResult = Math.round(sum * Math.pow(10, precision)) / Math.pow(10, precision);
        
        this.setOutputData(0, roundedResult);
    }
    
    MyAddNode.prototype.onSelected = function() {
        console.log("节点被选中:", this.customData.id);
        nodeManager.setSelectedNode(this);
    }

    MyAddNode.prototype.onPropertyChanged = function(name, value) {
        console.log(`属性 ${name} 改变为:`, value);
        
        const nodeData = nodeManager.getNodeData(this);
        if (nodeData) {
            nodeManager.updateNodeProperties(nodeData.id, { [name]: value });
        }
        
        return true;
    }

    // 注册其他节点类型
    function sum(a,b) {
        return a+b;
    }

    LiteGraph.wrapFunctionAsNode("math/sum", sum, ["Number","Number"],"Number");
    LiteGraph.registerNodeType("basic/sum", MyAddNode);
}