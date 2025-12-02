
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
        
        // // 防止页面滚动
        // window.addEventListener('keydown', (e) => {
        //     if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        //         e.preventDefault();
        //     }
        // });
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
        
        // 调整Monaco编辑器布局
        if (window.resizeMonacoEditor) {
            window.resizeMonacoEditor();
        }
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

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdaptiveCanvasManager };
}