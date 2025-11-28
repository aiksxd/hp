// monaco editor
require.config({ paths: { 'vs': '/js/vs' } });
require(['vs/editor/editor.main'], function () {

    // 初始化变量
    let fileCounter = 0;
    let defaultCode = [
        'fn main() {',
        '    print!("Hello Mr. Gao").unwrap();',
        '}',
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
        console.log("start listen editor")
        let changeTimeout;
        
        const handleChange = () => {
            clearTimeout(changeTimeout);
            changeTimeout = setTimeout(() => {
                editorCommManager.checkEditorContent();
            }, 1000); // 1秒防抖
        };
        editor.onDidChangeModelContent(function(e){
            handleChange();
        });
        editorArray.push(editor);
        return editor;
    }

    function addNewEditor(code, language) {
        let new_container = document.createElement("div");
        new_container.id = "editor-" + fileCounter.toString(10);
        new_container.className = "editor";
        document.getElementById("editor-container").appendChild(new_container);
        newEditor(new_container.id, code, language);
        fileCounter += 1;
    }
    // addNewEditor(defaultCode, 'rust');

    newEditor("main-editor", defaultCode, "rust");

    
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
        this.isUpdating = false;
        this.currentNodeId = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 监听节点选中事件
        document.addEventListener('nodeSelected', (event) => {
            this.handleNodeSelected(event.detail);
        });
    }
    
    handleNodeSelected(nodeData) {
        if (this.isUpdating) return;
        
        console.log('处理节点选中:', nodeData);
        this.currentNodeId = nodeData.id;
        
        // 格式化显示数据
        const data = {
            nodeId: nodeData.id,
            inputs: nodeData.inputs,
            outputs: nodeData.outputs,
            customInputs: nodeData.customInputs,
            dynamicInputs: nodeData.dynamicInputs
        };
        
        this.updateMonacoEditor(
            data,
            'node-config'
        );
    }
    
    updateMonacoEditor(data, contentType) {
        this.isUpdating = true;
        let editor;

        if (editorArray && editorArray[activeEditor]) {
            editor = editorArray[activeEditor];
        } else {
            return;
        }

        editor.setValue(JSON.stringify(data, null, 4));
        
        // 根据内容类型设置语言模式
        this.setEditorLanguage(editor, contentType);
        
        // 更新模式指示器
        this.updateModeIndicator(contentType);
        
        setTimeout(() => {
            this.isUpdating = false;
        }, 100);
    }

    setEditorLanguage(editor, contentType) {
        const model = editorArray[activeEditor].getModel();
        
        switch (contentType) {
            case 'node-config':
                monaco.editor.setModelLanguage(model, 'json');
                break;
            case 'code':
                const currentLanguage = model.getLanguageId();
                monaco.editor.setModelLanguage(model, currentLanguage);
                break;
            default:
                monaco.editor.setModelLanguage(model, 'plaintext');
        }
    }
    
    checkEditorContent() {
        if (this.isUpdating) return;
        
        let content = "";
        let editor;
        
        if (editorArray && editorArray[activeEditor]) {
            editor = editorArray[activeEditor];
            content = editor.getValue();
        }
        
        if (content && content.trim()) {
            this.handleEditorContentChange(content, editor);
        }
    }
    
    handleEditorContentChange(content) {
        const model = editorArray[activeEditor].getModel();
        const currentLanguage = model.getLanguageId();
        switch (currentLanguage) {
            case "json":
                this.handleJsonInputs(content)
            break;
        
            default:
                this.handleCodeContent(content, currentLanguage);
            break;
        }
    }

    handleJsonInputs(content) {
        const nodeData = JSON.parse(content);
        
        // 验证是否是节点配置
        if (!nodeData.nodeId) {
            console.log('不是节点配置JSON，忽略更新');
            return;
        }
        
        // 检查是否与当前选中节点匹配
        if (nodeData.nodeId !== this.currentNodeId) {
            console.log('节点ID不匹配，忽略更新');
            return;
        }
        // 更新节点数据
        const success = nodeManager.updateNodeFromEditorData(nodeData);
        // if (success) {
        //     console.log('节点更新成功');
        // } else {
        //     console.log('节点更新失败');
        // }
        
    }

    handleCodeContent(content, language) {
        console.log(`处理 ${language} 代码:`, content.substring(0, 20) + '...');
        // 这里可以添加代码执行、保存等功能
        
        // 保存代码到节点
        if (this.currentNodeId) {
            nodeManager.saveNodeCode(this.currentNodeId, content, language);
        }
    }

    setupModeIndicator() {
        // 创建模式指示器UI
        const indicator = document.createElement('div');
        indicator.id = 'editor-mode-indicator';
        indicator.style.cssText = `
            width: 100px;
            height: 100px;
            position: fixed;
            top: 100px;
            right: 100px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);
        
        this.modeIndicator = indicator;
    }

    updateModeIndicator(contentType) {
        if (!this.modeIndicator) return;
        
        const modeTexts = {
            'node-config': '🔧 节点配置模式',
            'code': '💻 代码编辑模式', 
            'text': '📝 文本编辑模式',
            'empty': '⚪ 空编辑器'
        };
        
        this.modeIndicator.textContent = modeTexts[contentType] || '❓ 未知模式';
        
        const colors = {
            'node-config': '#4CAF50',
            'code': '#2196F3',
            'text': '#FF9800'
        };
        
        this.modeIndicator.style.background = colors[contentType] || '#666';
    }
    
    updateNodeFromEditor(nodeData, newData) {
        // 更新属性
        if (newData.properties) {
            nodeData.properties = { ...nodeData.properties, ...newData.properties };
            
            // 找到实际的节点对象并更新
            const graph = window.graph; // 假设graph是全局的
            if (graph) {
                const node = graph._nodes.find(n => 
                    n.customData && n.customData.id === nodeData.id
                );
                if (node) {
                    node.properties = { ...node.properties, ...newData.properties };
                    console.log('节点属性已同步:', node.properties);
                }
            }
        }
        
        // 处理动态输入（下一步实现）
        if (newData.customInputs) {
            this.handleCustomInputs(nodeData, newData.customInputs);
        }
    }
    
    handleCustomInputs(nodeData, customInputs) {
        // 这里将在下一步实现动态输入功能
        console.log('处理动态输入:', customInputs);
    }
}

// 初始化编辑器通信
const editorCommManager = new EditorCommunicationManager();
const editor_container = document.getElementById('editor-container')

// 点击编辑器时展开
editor_container.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.add('active');
});

// 点击页面其他区域时收起
document.addEventListener('click', function(e) {
    if (!editor_container.contains(e.target)) {
        editor_container.classList.remove('active');
    }
});

// 可选：防止编辑器内容内的点击事件误触发收起
editor_container.addEventListener('click', function(e) {
    e.stopPropagation();
});