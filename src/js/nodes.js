function initializeDefaultNodes() {
    // -------------------- Compute Nodes ----------------------
    class jsNode extends runtimeNode {
        constructor() {
            super();
            this.title = "JavaScript";
            this.addInput("input", "*");
            this.addOutput("output", "*");
            this.properties = {
                description: "javascript node",
                fn: "",
                codeType: 'javascript'
            };
        }
    }

    class pythonNode extends runtimeNode {
        constructor() {
            super();
            this.title = "Python";
            this.addInput("input", "*");
            this.addOutput("output", "*");
            this.properties = {
                description: "python node",
                fn: "",
                codeType: 'python'
            };
        }
    }

    class shellNode extends runtimeNode {
        constructor() {
            super();
            this.title = "shellNode";
            this.addInput("input", "string");
            this.addOutput("output", "string");
            this.properties = {
                description: "shell node",
                fn: "",
                codeType: 'sh'
            };
            this.addWidget("text", "command", this.properties.fn, () => {
                // what i should write??
            });
        }
    }
    
    class one2oneShellNode extends runtimeNode {
        constructor() {
            super();
            this.title = "one2oneShell";
            this.properties = {
                description: "one to one shell node",
                fn: "",
                codeType: window.shell,
            };
            this.addWidget("text", "command", this.properties.fn, () => {
                // what i should write??
            });
            this.addInput("inputCmd1", "string");
            this.addOutput("returnValue1", "string");
        }
        async onExecute() {
            if (this.inputs) {
                for (let i = 0; i < this.inputs.length; i++) {
                    try {
                        let result = await executeTerminalCommand(this.getInputData(i));
                        // test todo
                        if (i < this.outputs.length) {
                            this.setOutputData(i, result);
                        }
                    } catch(err) {
                        console.error(this.id+"号节点执行错误:", err);
                    }
                }
            }
            if (this.properties.fn) {
                let result = await executeTerminalCommand(this.properties.fn);
                
                for (let i = 0; i < this.outputs.length; i++) {
                    this.setOutputData(i, result);
                }   
            }
        }
    }
    LiteGraph.registerNodeType("code/Python", pythonNode);
    LiteGraph.registerNodeType("code/JavaScript", jsNode);
    LiteGraph.registerNodeType("shell/Terminal", shellNode);
    LiteGraph.registerNodeType("shell/one2oneTerminal", one2oneShellNode);
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

    LiteGraph.registerNodeType("debug/Rand(Loop)", startNode);

}