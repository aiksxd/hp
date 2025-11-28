// workflow.js - 完整的自适应Canvas实现

class AdaptiveCanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // 防抖配置
        this.resizeTimeout = null;
        this.debounceDelay = 100; // 毫秒
        this.lastResizeTime = 0;
        
        // 性能监控
        this.resizeCount = 0;
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initialResize();
    }
    
    setupEventListeners() {
        // 窗口调整大小事件 - 带防抖
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 页面可见性变化（处理标签页切换）
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // 防止页面滚动
        window.addEventListener('keydown', (e) => {
            if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    handleResize() {
        const currentTime = Date.now();
        const timeSinceLastResize = currentTime - this.lastResizeTime;
        
        // 清除之前的定时器
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // 设置防抖定时器
        this.resizeTimeout = setTimeout(() => {
            this.performResize();
            this.lastResizeTime = Date.now();
        }, this.debounceDelay);
        
        // 如果距离上次调整超过500ms，立即执行一次（更好的用户体验）
        if (timeSinceLastResize > 500) {
            clearTimeout(this.resizeTimeout);
            this.performResize();
        }
    }
    
    handleVisibilityChange() {
        if (!document.hidden) {
            // 页面重新可见时，立即调整大小
            setTimeout(() => this.performResize(), 50);
        }
    }
    
    performResize() {
        const startTime = performance.now();
        
        try {
            this.resizeCanvas();
            this.resizeCount++;
            
            const resizeTime = performance.now() - startTime;
            this.showResizeInfo(`scale: ${this.canvas.width}x${this.canvas.height} | cost: ${resizeTime.toFixed(1)}ms`);
            
            // this.updateStatus(`已调整 ${this.resizeCount} 次 | 运行时间: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
            
        } catch (error) {
            console.error('Fail to resize canvas:', error);
            this.updateStatus('Fail to resize canvas');
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        
        // 获取容器尺寸
        const displayWidth = Math.floor(container.clientWidth);
        const displayHeight = Math.floor(container.clientHeight);
        
        // 检查尺寸是否有效
        if (displayWidth <= 0 || displayHeight <= 0) {
            console.warn('无效的容器尺寸');
            return;
        }
        
        // 检查尺寸是否实际发生变化
        if (this.canvas.style.width === `${displayWidth}px` && 
            this.canvas.style.height === `${displayHeight}px`) {
            return; // 尺寸未变化，跳过调整
        }
        
        // 设置画布显示尺寸
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
        
        // 设置画布实际像素尺寸（考虑DPI）
        this.canvas.width = Math.floor(displayWidth * dpr);
        this.canvas.height = Math.floor(displayHeight * dpr);
        
        // 缩放绘图上下文
        this.ctx.scale(dpr, dpr);
        
        // 重新绘制内容
        this.redrawContent();
        // 调整Monaco编辑器布局
        if (window.resizeMonacoEditor) {
            window.resizeMonacoEditor();
        }
    }
    
    redrawContent() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width / window.devicePixelRatio, this.canvas.height / window.devicePixelRatio);
        
        // 这里可以添加你的自定义绘制逻辑
        this.drawBackground();
        this.drawDebugInfo();
    }
    
    drawBackground() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(30, 60, 114, 0.3)');
        gradient.addColorStop(1, 'rgba(42, 82, 152, 0.3)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // 绘制网格
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    drawDebugInfo() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Canvas: ${width}×${height}`, width - 20, 30);
        this.ctx.fillText(`DPR: ${window.devicePixelRatio}`, width - 20, 50);
        this.ctx.fillText(`调整次数: ${this.resizeCount}`, width - 20, 70);
    }
    
    showResizeInfo(message) {
        popupMsg(message)
    }

    updateStatus(message) {
        popupMsg(message)
    }
    
    initialResize() {
        // 初始调整
        setTimeout(() => this.performResize(), 10);
    }
    
    // 销毁方法（清理事件监听器）
    destroy() {
        window.removeEventListener('resize', this.handleResize.bind(this));
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }
}

// LiteGraph 集成
function initializeLiteGraph() {

    function registerFunctionFromString(functionName, functionString) {
        try {
            // 使用 Function 构造函数
            const dynamicFunction = new Function('return ' + functionString)();
            
            // 注册到全局作用域
            window[functionName] = dynamicFunction;
            
            // 或者注册到特定命名空间
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

    // 先注册自定义节点类型
    function MyAddNode() {
        this.addInput("A", "number");
        this.addInput("B", "number");
        this.addOutput("A+B", "number");
        this.properties = { precision: 1 };
    }

    MyAddNode.title = "Sum";
    MyAddNode.prototype.onAdded = function() {
        if (!this.properties) {
            this.properties = {}
        }
        this.properties.index = nodeArray.length;
        nodeArray.push({"input": {"A": "number", "B": "number"}, "output": {"A+B": "number"}});

        
        // // 对象转 JSON 字符串
        // const jsonString = JSON.stringify(obj);
        // // JSON 字符串转对象
        // const obj = JSON.parse(jsonString);
    }
    MyAddNode.prototype.onExecute = function() {
        var A = this.getInputData(0);
        if (A === undefined) A = 0;
        var B = this.getInputData(1);
        if (B === undefined) B = 0;
        this.setOutputData(0, A + B);
    }
    
    const originalOnSelected = MyAddNode.prototype.onSelected;
    MyAddNode.prototype.onSelected = function() {
        if (originalOnSelected) {
            originalOnSelected.apply(this, arguments);
        }
        console.log(this.properties)
        editorArray[activeEditor].setValue(JSON.stringify(nodeArray[this.properties.index]));
        // editorArray[activeEditor].setModelLanguage(editorArray[activeEditor].getModel(), "json");
    }

    MyAddNode.prototype.onRemoved = function() {
        console.log(`node ${this.id} be removed, index: ${this.properties.index}`);
        
        // 可选：标记节点数据为已删除，而不是立即删除数组元素
        if (nodeArray[this.properties.index]) {
            nodeArray[this.properties.index].deleted = true;
            nodeArray[this.properties.index].removedAt = new Date().toISOString();
        }
    }

    function sum(a,b) {
        return a+b;
    }

    LiteGraph.wrapFunctionAsNode("math/sum",sum, ["Number","Number"],"Number");


    LiteGraph.registerNodeType("basic/sum", MyAddNode);
}

// 主初始化函数
document.addEventListener('DOMContentLoaded', function() {
    // 初始化自适应画布管理器
    const canvasManager = new AdaptiveCanvasManager('workflowCanvas');
    
    // 初始化LiteGraph
    initializeLiteGraph();
    
    // 创建LiteGraph实例
    setTimeout(() => {
        const graph = new LGraph();
        const canvas = new LGraphCanvas("#workflowCanvas", graph);
        // 启动图形
    }, 10);
    canvasManager.updateStatus('LiteGraph Launched');

});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdaptiveCanvasManager };
}