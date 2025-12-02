// workflow.js
function initializeDefaultNodes() {

    // -------------------- Compute Nodes ----------------------
    class jsNode {
        constructor() {
            this.title = "JavaScript";
            this.addInput("input", "number");
            this.addOutput("output", "number");
            this.properties = {
                description: "javascript node",
                fn: "",
                codeType: 'javascript'
            };
        }
        onExecute() {
            const f = new Function(this.properties.fn);
            f();
        }
        onSelected() {
            console.log("当前选中节点id:", this.id);

            const event = new CustomEvent('nodeSelected', {
                detail: this
            });
            document.dispatchEvent(event);
        }
    }
    // -------------------- Pre-prepared Nodes ----------------------
    class startNode {
        constructor() {
            this.title = "Rand Debug(JS)(Loop)";
            this.addOutput("Number", "number");
            this.addOutput("String", "string");
            this.serialize_widgets = true;
            this.properties = {
                description: "javascript node",
                fn: "",
                codeType: 'javascript',
            };
            // this.addWidget("number", "Number",
            //     current_value, callback,
            //     { min: 0, max: 100, step: 1 }
            // );
            this.addWidget("text", "name", "");
            // this.addWidget("combo", "Combo",
            //     value1, callback,
            //     { values: { "title1":value1, "title2":value2 } }
            // );

        }
        onExecute() {
            const f = new Function(this.properties.fn);
            f();
        }
        onSelected() {
            console.log("当前选中节点id:", this.id);

            const event = new CustomEvent('nodeSelected', {
                detail: this
            });
            document.dispatchEvent(event);
        }
    }

    LiteGraph.registerNodeType("code/JavaScript)", jsNode);
    LiteGraph.registerNodeType("debug/Rand(Loop)", startNode);

    // 注册其他节点类型
    function sum(a,b) {
        return a+b;
    }

    LiteGraph.wrapFunctionAsNode("math/sum", sum, ["Number","Number"],"Number");
}