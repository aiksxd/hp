// workflow.js
function initializeLiteGraph() {

    // 自定义节点类型
    function jsNode() {
        this.addInput("input", "number");
        this.addOutput("output", "number");
        this.properties = {
            description: "javascript node",
            fn: "",
            codeType: 'javascript'
        };
    }

    jsNode.title = "JavaScript";
    
    jsNode.prototype.onExecute = function() {
        const f = new Function(this.properties.fn);
        f();
    }
    
    jsNode.prototype.onSelected = function() {
        console.log("节点被选中:", this.id);
        
        const event = new CustomEvent('nodeSelected', { 
            detail: this
        });
        document.dispatchEvent(event);
    }

    LiteGraph.registerNodeType("javascript", jsNode);

    // 注册其他节点类型
    function sum(a,b) {
        return a+b;
    }

    LiteGraph.wrapFunctionAsNode("math/sum", sum, ["Number","Number"],"Number");
}