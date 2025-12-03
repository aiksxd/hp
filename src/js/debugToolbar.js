// 获取DOM元素
const debugToolbar = document.getElementById("debugToolbar");
const statusIndicator = document.querySelector(".status-indicator");

// 获取所有按钮
const btnNext = document.getElementById("btnNext");
const btnRun = document.getElementById("btnRun");
const btnRetrun = document.getElementById("btnRetrun");
const btnStop = document.getElementById("btnStop");
const btnToggleBreakpoint = document.getElementById("btnToggleBreakpoint");

// 更新调试状态显示
function updateDebugStatus() {
    if (debugState === "running") {
        statusIndicator.className = "status-indicator status-running";
        statusIndicator.innerHTML = '<div class="status-dot"></div><span>running</span>';
        btnStop.classList.remove("active");
    } else if (debugState === "paused") {
        statusIndicator.className = "status-indicator status-paused";
        statusIndicator.innerHTML = '<div class="status-dot"></div><span>paused</span>';
        btnStop.classList.add("active");
    } else if (debugState === "stopped") {
        statusIndicator.className = "status-indicator status-stopped";
        statusIndicator.innerHTML = '<div class="status-dot"></div><span>stopped</span>';
        btnStop.classList.remove("active");
    }
}

// 按钮点击事件处理
btnNext.addEventListener("click", function () {
    if (debugState === "paused") {
        debugState = "running";
        updateDebugStatus();
    }

    this.classList.add("active");
    // receive run out one event todo (clear)
    setTimeout(() => this.classList.remove("active"), 200);
});

btnRun.addEventListener("click", function () {
    window.graph.runStep();
    debugState = "running";
    updateDebugStatus();
    this.style.display = "none";
    btnNext.style.width = "0";
    btnStop.style.display = "flex";
});

btnStop.addEventListener("click", function () {
    debugState = "stopped";
    updateDebugStatus();
    this.style.display = "none";
    btnNext.attributes.removeNamedItem('style');
    btnRun.style.display = "flex";
});

btnRetrun.addEventListener("click", function () {
    debugState = "paused";
    updateDebugStatus();
    this.classList.add("active");
    setTimeout(() => this.classList.remove("active"), 200);
});

btnToggleBreakpoint.addEventListener("click", function () {
    const isActive = this.classList.contains("active");

    if (isActive) {
        this.classList.remove("active");
        console.log(`在第${null}行移除断点`);
    } else {
        this.classList.add("active");
        console.log(`在第${null}行设置断点`);
    }

    // 添加点击效果
    this.style.transform = "scale(0.95)";
    setTimeout(() => {
        this.style.transform = "";
    }, 200);
});

// 添加键盘快捷键支持
document.addEventListener("keydown", function (event) {
    if (document.activeElement === document.querySelector('#workflowCanvas') || document.activeElement === document.body) {
        // n / F1 / Alt + 1 -> Next
        if (event.key === "n" || event.key === "F1" || (event.key === "1" && event.altKey)) {
            event.preventDefault();
            btnNext.click();
        }

        // r / Alt + 5 -> Run
        if (event.key === "r" || event.key === "5" && event.altKey) {
            event.preventDefault();
            if (debugState === "running") {
                btnStop.click();
            } else {
                btnRun.click();
            }
        }

        // Alt + 4 -> Return
        if (event.key === "4" && event.altKey) {
            event.preventDefault();
            btnRetrun.click();
        }

        // d / F3 / Alt + 3 -> ToggleBreakpoint
        if (event.key === "d" || event.key === "F3" || (event.key === "3" && event.altKey)) {
            event.preventDefault();
            btnToggleBreakpoint.click();
        }
    }
});

// 初始状态 调试状态
let debugState = "stopped"; // running, paused, stopped
updateDebugStatus();
