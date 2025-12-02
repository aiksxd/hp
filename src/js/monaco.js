// monaco editor
require.config({ paths: { 'vs': '/js/vs' } });
require(['vs/editor/editor.main'], function () {

    // 初始化变量
    let fileCounter = 0;
    let defaultCode = [
        '## welcome',
        '1. double click to create a node',
        '2. click a node to start edit',
        `-  Alt + N : next tool`
    ].join('\n');

    monaco.editor.defineTheme("myTheme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
            // "editor.foreground": "#000000",
            "editor.background": "#282C33",
            // "editorCursor.foreground": "#8B0000",
            "editor.lineHighlightBackground": "#2D323B",
            // "editorLineNumber.foreground": "#008800",
            // "editor.selectionBackground": "#88000030",
            // "editor.inactiveSelectionBackground": "#88000015",
        },
    });
    monaco.editor.setTheme("myTheme");

    // 新建一个编辑器
    function newEditor(container_id, code, language) {
        let model = monaco.editor.createModel(code, language);
        let editor = monaco.editor.create(document.getElementById(container_id), {
            model: model,
            fontFamily: "JetBrains Mono",
            fontSize: 20,
            automaticLayout: true,
        });
        
        const handleChange = () => {
            clearTimeout(window.editorContentSaveTimeout);
            window.editorContentSaveTimeout = undefined;
            window.editorContentSaveTimeout = setTimeout(() => {
                editorCommManager.saveEditorContent();
            }, 1000); // 1秒防抖
        };
        editor.onDidChangeModelContent(function(e){
            console.log(e)
            if (editorCommManager.currentNodeId === null) {
                return;
            }
            // prevent changing page(with content) leading to call handle()
            if (editorCommManager.lastEditContent !== window.editContentType) {
                editorCommManager.lastEditContent = window.editContentType;
                return
            }
            // prevent changing node(too...) leading to call handle()
            if (editorCommManager.isChangingNode) {
                editorCommManager.isChangingNode = false;
                return;
            }
            editorCommManager.isNodeModified = true;
            handleChange();
        });
        editorArray.push(editor);
        return editor;
    }

    // todo later
    function addNewEditor(code, language) {
        let new_container = document.createElement("div");
        new_container.id = "editor-" + fileCounter.toString(10);
        new_container.className = "editor";
        document.getElementById("editor-container").appendChild(new_container);
        newEditor(new_container.id, code, language);
        fileCounter += 1;
    }
    // addNewEditor(defaultCode, 'rust');

    window.editor = newEditor("main-editor", defaultCode, "markdown");

    
    // 全局函数，用于调整nav布局
    window.resizeMonacoEditor = function() {
        const baseElement = document.querySelector('#main-editor');
        const targetElement = document.querySelector('#main-editor-navs'); // 计算并设置目标元素的宽度
        let baseWidth = baseElement.offsetWidth;
        targetElement.style.width = (baseWidth * 0.03) + 'px'; // 初始设置
    };

});;
// 编辑器通信管理器
class EditorCommunicationManager {
    constructor() {
        this.currentNodeId = null;
        this.lastEditContent = null;
        this.isUpdating = false;
        this.isChangingNode = false;
        this.isNodeModified = false;
        this.setupEventListeners();
    }
    // ----------------------- Editor Recive -----------------
    setupEventListeners() {
        // 监听节点选中事件
        document.addEventListener('nodeSelected', (event) => {
            // prevent click same node leading to handle
            if (event.detail.id !== this.currentNodeId) {
                this.isChangingNode = true;
                this.currentNodeId = event.detail.id;
                this.handleNewDataComing(event.detail);
            }
        });
    }
    
    // call when node selected or change edit content(node-config or node's function)
    handleNewDataComing(nodeData) {
        if (this.isUpdating) return;
        let data;
        let contentType = 'plaintext';
        // provide new data and mark it false for preventing saving data 
        // when change editor content without modification
        this.isNodeModified = false;
        // 格式化显示数据
        switch (window.editContentType) {
            case 'node':
                data = {
                    title: nodeData.title,
                    inputs: nodeData.inputs,
                    outputs: nodeData.outputs,
                };
                contentType = 'yaml';
            break;
            case 'code':
                if (nodeData.properties.fn) {
                    data = nodeData.properties.fn;
                } else {
                    let inputsCode = '';
                    let outputsCode = '';
                    if (nodeData.inputs) {
                        inputsCode = nodeData.inputs.map((input, i) => `let ${input.name} = inputs.input_${i};`).join('\n');
                    }
                    if (nodeData.outputs) {
                        outputsCode = nodeData.outputs.map(output => `${output.name}: ""`).join(', ');
                    }
                    data = [
                        `${inputsCode}`,
                        `// write your code here`,
                        `return {${outputsCode}}`
                    ].join('\n');
                }
                contentType = nodeData.properties.codeType;
            break;
        
            default:
                data = nodeData.properties.description;
            break;
        }
        
        this.updateMonacoEditor(
            data,
            contentType
        );
    }
    
    updateMonacoEditor(data, contentType) {
        this.isUpdating = true;
        const model = window.editor.getModel();
        window.editor.setValue(data);
        monaco.editor.setModelLanguage(model, contentType);
        // waiting editor update content
        setTimeout(() => {
            this.isUpdating = false;
        }, 100);
    }

    // ----------------------- Editor Write -----------------
    saveEditorContent() {
        if (this.isUpdating) return;
        
        let content = window.editor.getValue();
        
        if (content && content.trim()) {
            this.handleEditorContentChange(content, editor);
        }
    }
    
    handleEditorContentChange(content) {
        switch (window.editContentType) {
            case 'node':
                this.handleNodeUpdate(content)
            break;
            case 'code':
                this.handleCodeContent(content);
            break;

            default:
            break;
        }
    }

    handleNodeUpdate(content) {
        let newData = simpleToJson(content)
        // let newData = JSON.parse(content)
        let node = findById(window.graph._nodes, this.currentNodeId);
        
        while(node.inputs && node.inputs.length) {
            node.removeInput(0);
        }
        while(node.outputs && node.outputs.length) {
            node.removeOutput(0);
        }
        node.title = newData.title;
        // 添加新输入
        node.addInputs(newData.inputs.map(input => [
            input.name, 
            input.type, 
            Object.fromEntries(
                Object.entries(input).filter(([key]) => 
                    !['name', 'type'].includes(key)
                )
            )
        ]));

        node.addOutputs(newData.outputs.map(output => [
            output.name, 
            output.type, 
            Object.fromEntries(
                Object.entries(output).filter(([key]) => 
                    !['name', 'type'].includes(key)
                )
            )
        ]));
    
        let i = 0
        while (i < Array.from(node.outputs).length) {
            Array.from(node.outputs)[i].links = [];
            // Array.from(node.outputs)[i].links = Array.from(newData.outputs)[i].links;
            i++;
        }
            // node.addInputs([
            //     // 基础输入端口
            //     ["input1", "number"],
                
            //     // 带配置的输入端口
            //     ["input2", "string", {
            //         label: "文本输入",
            //         required: true,
            //         widget: "text"
            //     }],
                
            //     // 另一个带配置的端口
            //     ["input3", "boolean", {
            //         default: false,
            //         color: "#FF0000"
            //     }],
                
            //     // 数组类型输入
            //     ["data", "array", {
            //         accept: ["number", "string"],
            //         max_connections: 3
            //     }]
            // ])
        // }
    }

    handleCodeContent(content) {
        let node = findById(window.graph._nodes, this.currentNodeId);
        
        // 保存代码到节点
        if (this.currentNodeId) {
            console.log(`处理 ${node.properties.codeType} 代码:`, content.substring(0, 20) + '...');
            node.properties.fn = content;
        }
    }
    
}

// 初始化编辑器通信
const editorCommManager = new EditorCommunicationManager();
const editor_container = document.getElementById('editor-container')

// 点击编辑器时展开
editor_container.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    this.classList.add('active');
});

document.addEventListener('mouseup', function(e) {
    editor_container.classList.remove('active');
});

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

// const compressJSON = obj => `{
// "title":${JSON.stringify(obj.title)},
// "inputs": [
// ${obj.inputs.map(i => `    ${JSON.stringify({name:i.name,type:i.type})}`).join(',\n')}
// ],"outputs": [
// ${obj.outputs.map(o => `    ${JSON.stringify({name:o.name,type:o.type})}`).join(',\n')}
// ]}`;

function jsonToSimple(obj) {
    const {title, inputs, outputs} = obj;
    
    return `title: ${title}
inputs:
${inputs.map(i => `  - ${i.name} (${i.type})`).join('\n')}
outputs:
${outputs.map(o => `  - ${o.name} (${o.type})`).join('\n')}`;
}

function simpleToJson(simpleText) {
    const lines = simpleText.split('\n').filter(line => line.trim());
    const result = {
        title: '',
        inputs: [],
        outputs: []
    };
    
    let currentSection = '';
    
    lines.forEach(line => {
        if (line.startsWith('title:')) {
            result.title = line.replace('title:', '').trim();
        } else if (line === 'inputs:') {
            currentSection = 'inputs';
        } else if (line === 'outputs:') {
            currentSection = 'outputs';
        } else if (line.startsWith('  - ') && currentSection) {
            const match = line.match(/  - (.+) \((.+)\)/);
            if (match) {
                result[currentSection].push({
                    name: match[1],
                    type: match[2]
                });
            }
        }
    });
    
    return result;
}