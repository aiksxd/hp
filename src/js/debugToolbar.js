// 获取DOM元素
const debugToolbar = document.getElementById("debugToolbar");
// const debugStatus = document.getElementById('debugStatus');
const statusIndicator = document.querySelector(".status-indicator");

// 调试状态
let debugState = "paused"; // running, paused, stopped

// 获取所有按钮
const btnContinue = document.getElementById("btnContinue");
const btnStepOver = document.getElementById("btnStepOver");
const btnStepInto = document.getElementById("btnStepInto");
const btnStepOut = document.getElementById("btnStepOut");
const btnRestart = document.getElementById("btnRestart");
const btnStop = document.getElementById("btnStop");
const btnToggleBreakpoint = document.getElementById("btnToggleBreakpoint");
const btnViewBreakpoints = document.getElementById("btnViewBreakpoints");

// 更新调试状态显示
function updateDebugStatus() {
  if (debugState === "running") {
    // debugStatus.innerHTML = '<i class="fas fa-play-circle"></i> 正在运行...';
    statusIndicator.className = "status-indicator status-running";
    statusIndicator.innerHTML =
      '<div class="status-dot"></div><span>正在运行</span>';
    btnStop.classList.remove("active");
  } else if (debugState === "paused") {
    // debugStatus.innerHTML = `<i class="fas fa-pause-circle"></i> 已暂停`;
    statusIndicator.className = "status-indicator status-paused";
    statusIndicator.innerHTML =
      '<div class="status-dot"></div><span>已暂停</span>';
    btnStop.classList.add("active");
  } else if (debugState === "stopped") {
    // debugStatus.innerHTML = '<i class="fas fa-stop-circle"></i> 调试已停止';
    statusIndicator.className = "status-indicator status-stopped";
    statusIndicator.innerHTML =
      '<div class="status-dot"></div><span>已停止</span>';
    btnStop.classList.remove("active");
  }
}

// 按钮点击事件处理
btnContinue.addEventListener("click", function () {
  if (debugState === "paused") {
    debugState = "running";
    updateDebugStatus();

    // 模拟运行一段时间后暂停
    setTimeout(() => {
      debugState = "paused";
      // 随机跳到下一行
      updateDebugStatus();
    }, 1500);
  }

  // 添加点击效果
  this.classList.add("active");
  setTimeout(() => this.classList.remove("active"), 200);
});

btnStepOver.addEventListener("click", function () {
  // todo
  // 添加点击效果
  this.classList.add("active");
  setTimeout(() => this.classList.remove("active"), 200);
});

btnRestart.addEventListener("click", function () {
  debugState = "running";
  updateDebugStatus();

  setTimeout(() => {
    debugState = "paused";
    updateDebugStatus(18); // 回到开始
  }, 1000);

  // 添加点击效果
  this.classList.add("active");
  setTimeout(() => this.classList.remove("active"), 200);
});

btnStop.addEventListener("click", function () {
  if (debugState === "stopped") {
    return;
  }
  debugState = "stopped";
  updateDebugStatus();
});

btnToggleBreakpoint.addEventListener("click", function () {
  // 切换断点状态
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

// 初始状态
updateDebugStatus();

// 添加键盘快捷键支持
document.addEventListener("keydown", function (event) {
  // F9 - 继续运行
  if (event.key === "F9" || (event.key === "9" && event.altKey)) {
    event.preventDefault();
    btnContinue.click();
  }

  // F8 - 步过
  if (event.key === "F8" || (event.key === "8" && event.altKey)) {
    event.preventDefault();
    btnStepOver.click();
  }

  // F7 - 步入
  if (event.key === "F7" || (event.key === "7" && event.altKey)) {
    event.preventDefault();
    btnStepInto.click();
  }

  // Shift+F8 - 步出
  if (event.key === "F8" && event.shiftKey) {
    event.preventDefault();
    btnStepOut.click();
  }

  // Shift+F5 - 停止
  if (event.key === "F5" && event.shiftKey) {
    event.preventDefault();
    btnStop.click();
  }
});

// 初始提示
console.log("调试工具栏已加载，可以使用以下快捷键：");
console.log("F9 - 继续运行");
console.log("F8 - 步过");
console.log("F7 - 步入");
console.log("Shift+F8 - 步出");
console.log("Shift+F5 - 停止调试");
