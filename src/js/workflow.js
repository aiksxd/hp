// workflow.js - 简化的版本
// LiteGraph 集成
function initializeLiteGraph() {

    // 自定义节点类型
    function MyAddNode() {
        this.addInput("input", "number");
        this.addOutput("output", "number");
        this.properties = {
            description: "sample node"
        };

        // 注册到节点管理器
        const nodeData = nodeManager.addNode(this, "basic/sample");

        // 初始化节点数据
        nodeData.inputs = {
            "input": "number"
        };
        nodeData.outputs = {
            "output": "number"
        };
    }

    MyAddNode.title = "sample";
    
    MyAddNode.prototype.onExecute = function() {
        let fn = Array.from(nodes.get(this.id))[2](...args)
        // 使用精度设置
        const precision = this.properties.precision || 1;
        
        this.setOutputData(0, fn());
    }
    
    MyAddNode.prototype.onSelected = function() {
        console.log("节点被选中:", this.customData.id);
        nodeManager.setSelectedNode(this);
    }

    MyAddNode.prototype.onPropertyChanged = function(name, value) {
        
        const nodeData = nodeManager.getNodeData(this);
        if (nodeData) {
            nodeManager.updateNodeProperties(nodeData.id, { [name]: value });
        }
        
        return true;
    }
    LiteGraph.registerNodeType("basic/sum", MyAddNode);

    // 注册其他节点类型
    function sum(a,b) {
        return a+b;
    }

    LiteGraph.wrapFunctionAsNode("math/sum", sum, ["Number","Number"],"Number");
}