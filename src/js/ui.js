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

// 页面加载完成后初始化标签切换
document.addEventListener('DOMContentLoaded', function() {
    const editorBtn = document.getElementById('editor-btn');
    const terminalBtn = document.getElementById('terminal-btn');
    const editorSection = document.querySelector('.multi-editors');
    const terminalSection = document.getElementById('terminal');
    
    // 编辑器按钮点击事件
    editorBtn.addEventListener('click', function() {
        editorBtn.classList.add('active');
        terminalBtn.classList.remove('active');
        editorSection.classList.add('activePage');
        terminalSection.classList.remove('activePage');
    });
    
    // 终端按钮点击事件
    terminalBtn.addEventListener('click', function() {
        terminalBtn.classList.add('active');
        editorBtn.classList.remove('active');
        terminalSection.classList.add('activePage');
        editorSection.classList.remove('activePage');
    });
});