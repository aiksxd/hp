
// -------------------- Derived Nodes ----------------------
class runtimeNode {
    constructor() {
        this.serialize_widgets = true;
    }
    async onExecute() {
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
            let result;
            try {
                switch (this.properties.codeType) {
                    case "javascript":
                        // 将输入对象作为参数传递给用户函数
                        const userFunction = new Function('inputs', `${this.properties.fn}`);
                        result = userFunction(inputs);
                    break;
                    case "python":
                        result = await python_exec(this.properties.fn, inputs);
                    break;
                    case "sh":
                        // shell command
                        result = await executeTerminalCommand(this.properties.fn, inputs);
                    break;
                    case "rust":
                        result = await rust_exec(this.properties.fn, inputs);
                    break;
                    default:
                        console.log('unknown type');
                    break;
                }
            } catch(err) {
                result = {
                    error: true,
                    labelMarkedForOutputs: 'rawResult',
                    detail: err
                }
            }
            // debug
            // console.log(result);

            // test todo
            if (result === undefined || result === null) {
                // 如果没有返回值，清空所有输出
                for (let i = 0; i < this.outputs.length; i++) {
                    this.setOutputData(i, null);
                }
                return;
            }
            
            // 情况1：返回值是对象（按输出端口名称映射）
            if (typeof result === 'object' && result.hasOwnProperty('labelMarkedForOutputs')) {
                switch (result.labelMarkedForOutputs) {
                    case 'rawResult':
                        // object made for error check
                        if (result.error = true) {
                            for (let i = 0; i < this.outputs.length; i++) {
                                this.setOutputData(i, undefined);
                            }
                            console.error("Node"+this.id+"run ERROR: ", result.detail);
                        } else if (result.result) {
                            for (let i = 0; i < this.outputs.length; i++) {
                                this.setOutputData(i, result.result);
                            }
                        }
                    break;
                    case 'outputs':
                        // object made for outputs
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
                    default:
                    break;
                }
                return;
            }
            
            // // 情况2：返回值是数组（按顺序映射到输出端口）
            // if (Array.isArray(result)) {
            //     for (let i = 0; i < Math.min(result.length, this.outputs.length); i++) {
            //         this.setOutputData(i, result[i]);
            //     }
            //     return;
            // }
            
            // 情况3：单个值
            for (let i = 0; i < this.outputs.length; i++) {
                this.setOutputData(i, result);
            }
            
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