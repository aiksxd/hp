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

});
const editor_container = document.getElementById('editor-container');

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