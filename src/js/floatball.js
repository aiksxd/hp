document.addEventListener('DOMContentLoaded', () => {
    setupMenuInteractions();
});

// 设置菜单交互 todo
function setupMenuInteractions() {
    const iconItems = document.querySelectorAll('.icon-item');
    
    iconItems.forEach(item => {
        // 键盘访问支持
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 添加点击动画
            this.classList.add('clicked');
            
            // 模拟功能执行
            const itemId = this.id;
            triggerAction(itemId);
            
            // 移除点击动画类
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 300);
        });

        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // 添加键盘可访问性
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `${item.id}`);
    });
    
}

// 菜单功能执行
function triggerAction(action) {
    switch(action) {
        case 'save':
            exportGraph();
        break;
        case 'import':
            importGraph()
        break;
        case 'settings':
        break;
    }
}