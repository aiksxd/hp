
// -------------------- Derived Nodes ----------------------
class runtimeNode {
    constructor() {
        this.serialize_widgets = true;
    }
    onExecute() {
        try {
            // 1. 收集所有输入端口的数据，构建输入参数对象
            const inputs = {};
            if (this.inputs) {
                for (let i = 0; i < this.inputs.length; i++) {
                    // const inputName = this.getInputName(i) || `input_${i}`;
                    const inputName = `input_${i}`;
                    inputs[inputName] = this.getInputData(i);
                }
            }
            
            // 2. 将输入对象作为参数传递给用户函数
            const userFunction = new Function('inputs', `
                try {
                    ${this.properties.fn}
                } catch(err) {
                    console.error("用户函数执行错误:", err);
                    return { error: err.message };
                }
            `);
            
            // 3. 执行用户函数，传入输入对象
            const result = userFunction(inputs);

            if (result === undefined || result === null) {
                // 如果没有返回值，清空所有输出
                for (let i = 0; i < this.outputs.length; i++) {
                    this.setOutputData(i, null);
                }
                return;
            }
            
            // 情况1：返回值是对象（按输出端口名称映射）
            if (typeof result === 'object' && !Array.isArray(result)) {
                for (let i = 0; i < this.outputs.length; i++) {
                    const outputName = this.outputs[i].name;
                    if (result.hasOwnProperty(`output_${i}`)) {
                        // perior output_0, output_1
                        this.setOutputData(i, result[`output_${i}`]);
                    } else if (outputName && result.hasOwnProperty(outputName)) {
                        // then name
                        this.setOutputData(i, result[outputName]);
                    } else {
                        this.setOutputData(i, undefined);
                    }
                }
                return;
            }
            
            // 情况2：返回值是数组（按顺序映射到输出端口）
            if (Array.isArray(result)) {
                for (let i = 0; i < Math.min(result.length, this.outputs.length); i++) {
                    this.setOutputData(i, result[i]);
                }
                return;
            }
            
            // 情况3：单个值（设置到第一个输出端口）
            this.setOutputData(0, result);
            
        } catch(err) {
            console.error(this.id+"号节点执行错误:", err);
        }
    }
    onSelected() {
        console.log("当前选中节点id:", this.id);

        const event = new CustomEvent('nodeSelected', {
            detail: this
        });
        document.dispatchEvent(event);
    }
}

class shellNode {
    constructor() {
        this.serialize_widgets = true;
        this.properties = {
            fn: "",
            codeType: window.shell,
        };
        this.addWidget("text", "command", this.properties.fn, () => {
            // what i should write??
        });
    }
    async onExecute() {
        if (this.inputs) {
            for (let i = 0; i < this.inputs.length; i++) {
                try {
                    let result = await executeTerminalCommand(this.getInputData(i));
                    
                    for (let i = 0; i < this.outputs.length; i++) {
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
    onSelected() {
        console.log("当前选中节点id:", this.id);

        const event = new CustomEvent('nodeSelected', {
            detail: this
        });
        document.dispatchEvent(event);
    }
}