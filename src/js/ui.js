function popupMsg(message) {
    let statusInfo = document.createElement('div')
    statusInfo.className = "resize-info"
    statusInfo.id = "resizeInfo"
    statusInfo.textContent = message;
    statusInfo.classList.add('visible');
    document.querySelector('.canvas-container').append(statusInfo)
    // 3秒后隐藏信息
    setTimeout(() => {
        statusInfo.classList.remove('visible');
        setTimeout(() => statusInfo.remove(), 800);
    }, 3000);
}

// 显示使用提示
function showHint(text) {
    // 只在首次加载时显示提示
    // if (!sessionStorage.getItem('hintShown')) {
    //     sessionStorage.setItem('hintShown', 'true');
    // }
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.innerHTML = `✨ ${text} ✨`;
    document.body.appendChild(hint);
    
    setTimeout(() => {
        hint.classList.remove('hint');
        hint.remove();
    }, 3000);
        
}
function switchSection(sectionType) {
    if (window.editContentType === sectionType) {
        return;
    }
    clearTimeout(window.editorContentSaveTimeout);
    window.editorContentSaveTimeout = undefined;
    if (editorCommManager.isNodeModified) {
        editorCommManager.saveEditorContent();
    }
    const nodeEditorBtn = document.getElementById('node-editor-btn');
    const codeEditorBtn = document.getElementById('code-editor-btn');
    const terminalBtn = document.getElementById('terminal-btn');
    const filesBtn = document.getElementById('files-btn');
    const editorSection = document.querySelector('.multi-editors');
    const terminalSection = document.getElementById('terminal');
    const filesSection = document.getElementById('files');
    
    // 重置所有按钮和区域
    [nodeEditorBtn, codeEditorBtn, terminalBtn, filesBtn].forEach(btn => {
        btn?.classList.remove('active');
    });
    [editorSection, terminalSection, filesSection].forEach(section => {
        section?.classList.remove('activePage');
    });

    // 根据类型激活对应的按钮和区域
    switch(sectionType) {
        case 'node':
            nodeEditorBtn?.classList.add('active');
            editorSection?.classList.add('activePage');
            window.editContentType = 'node';
            if (editorCommManager.currentNodeId !== null) {
                editorCommManager.handleNewDataComing(findById(window.graph._nodes, editorCommManager.currentNodeId))
            }
            break;
        case 'code':
            codeEditorBtn?.classList.add('active');
            editorSection?.classList.add('activePage');
            window.editContentType = 'code';
            if (editorCommManager.currentNodeId !== null) {
                editorCommManager.handleNewDataComing(findById(window.graph._nodes, editorCommManager.currentNodeId))
            }
            break;
        case 'terminal':
            terminalBtn?.classList.add('active');
            terminalSection?.classList.add('activePage');
            break;
        case 'files':
            filesBtn?.classList.add('active');
            filesSection?.classList.add('activePage');
            break;
    }
}
const sectionOrder = ['files', 'terminal', 'node', 'code'];
let currentSectionIndex = 0; // 跟踪当前激活的 section
// Alt+N quickly change page
document.addEventListener('keydown', function(event) {
    if (event.altKey && event.key === 'n') {
        // event.preventDefault(); // 阻止浏览器默认行为
        
        // 计算下一个 section 的索引
        currentSectionIndex = (currentSectionIndex + 1) % sectionOrder.length;
        
        // 切换到下一个 section
        switchSection(sectionOrder[currentSectionIndex]);
    }
    
});

document.addEventListener('DOMContentLoaded', function() {
    // what i want to write?
});