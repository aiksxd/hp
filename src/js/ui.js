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