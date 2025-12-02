function initializeDefaultNodes() {
    // -------------------- Compute Nodes ----------------------
    class jsNode extends runtimeNode {
        constructor() {
            super();
            this.title = "JavaScript";
            this.addInput("input", "number");
            this.addOutput("output", "number");
            this.properties = {
                description: "javascript node",
                fn: "",
                codeType: 'javascript'
            };
        }
    }
    // -------------------- Pre-prepared Nodes ----------------------
    class startNode extends runtimeNode {
        constructor() {
            super();
            this.title = "Rand Debug(Loop)";
            this.addOutput("number", "number");
            this.addOutput("string", "string");
            this.properties = {
                description: "javascript node",
                fn: "",
                codeType: 'javascript',
            };
            this.addWidget("button", "run", null, () => {
                this.onExecute();
            });
        }
    }

    LiteGraph.registerNodeType("code/JavaScript", jsNode);
    LiteGraph.registerNodeType("debug/Rand(Loop)", startNode);
    LiteGraph.registerNodeType("shell/Terminal", shellNode);

    // 注册其他节点类型
    function sum(a,b) {
        return a+b;
    }

    LiteGraph.wrapFunctionAsNode("math/sum", sum, ["Number","Number"],"Number");
}