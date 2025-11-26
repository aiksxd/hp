const { getCurrentWindow } = window.__TAURI__.window;

const appWindow = getCurrentWindow();

// 为最小化按钮绑定事件
document.getElementById('titlebar-minimize').addEventListener('click', () => {
    appWindow.minimize();
});

// 为最大化/还原按钮绑定事件
document.getElementById('titlebar-maximize').addEventListener('click', () => {
    appWindow.toggleMaximize();
});

// 为关闭按钮绑定事件
document.getElementById('titlebar-close').addEventListener('click', () => {
    appWindow.close();
});
