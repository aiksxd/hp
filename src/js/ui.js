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

// 动态输入管理UI
class DynamicInputUI {
    static showAddInputDialog(node) {
        const inputName = prompt('请输入新输入的名称:', 'input' + Date.now());
        if (!inputName) return;
        
        const inputType = prompt('请输入输入类型 (number/string/boolean):', 'number');
        if (!inputType) return;
        
        const success = nodeManager.addDynamicInput(node, inputName, inputType);
        if (success) {
            // 更新编辑器显示
            const nodeData = nodeManager.getNodeData(node);
            nodeManager.notifyEditorUpdate(nodeData);
            alert('输入添加成功!');
        } else {
            alert('添加输入失败，可能已存在同名输入');
        }
    }
    
    static showInputManagementDialog(node) {
        const nodeData = nodeManager.getNodeData(node);
        if (!nodeData) return;
        
        let message = '当前动态输入:\n';
        nodeData.dynamicInputs.forEach((input, index) => {
            message += `${index + 1}. ${input.name} (${input.type})\n`;
        });
        
        message += '\n输入要删除的输入名称 (留空取消):';
        const inputToRemove = prompt(message);
        
        if (inputToRemove && inputToRemove.trim()) {
            const success = nodeManager.removeDynamicInput(node, inputToRemove.trim());
            if (success) {
                // 更新编辑器显示
                nodeManager.notifyEditorUpdate(nodeData);
                alert('输入删除成功!');
            } else {
                alert('删除输入失败');
            }
        }
    }
}

// 设置节点上下文菜单
function setupNodeContextMenu() {
    document.addEventListener('contextmenu', (e) => {
        const node = findNodeAtPosition(e.clientX, e.clientY);
        if (node) {
            e.preventDefault();
            showNodeContextMenu(e.clientX, e.clientY, node);
        }
    });
}

function findNodeAtPosition(x, y) {
    if (!window.graph) return null;
    
    // 简化的查找逻辑 - 实际应该使用LiteGraph的坐标转换
    return window.graph._nodes.find(node => {
        const nodeX = node.pos[0];
        const nodeY = node.pos[1];
        const nodeWidth = node.size[0];
        const nodeHeight = node.size[1];
        
        return x >= nodeX && x <= nodeX + nodeWidth && 
               y >= nodeY && y <= nodeY + nodeHeight;
    });
}

function showNodeContextMenu(x, y, node) {
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 5px 0;
        min-width: 150px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
    `;
    
    const menuItems = [
        {
            text: '📝 编辑属性',
            action: () => node.onSelected && node.onSelected()
        },
        {
            text: '➕ 添加输入',
            action: () => DynamicInputUI.showAddInputDialog(node)
        },
        {
            text: '🔧 管理输入',
            action: () => DynamicInputUI.showInputManagementDialog(node)
        },
        { text: '---' },
        {
            text: '🗑️ 删除节点',
            action: () => window.graph && window.graph.remove(node)
        }
    ];
    
    menuItems.forEach(item => {
        if (item.text === '---') {
            const divider = document.createElement('div');
            divider.style.cssText = 'height: 1px; background: #eee; margin: 5px 0;';
            menu.appendChild(divider);
        } else {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                font-size: 14px;
            `;
            menuItem.onmouseover = () => menuItem.style.background = '#f0f0f0';
            menuItem.onmouseout = () => menuItem.style.background = 'transparent';
            menuItem.onclick = () => {
                item.action();
                document.body.removeChild(menu);
            };
            menu.appendChild(menuItem);
        }
    });
    
    document.body.appendChild(menu);
    
    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
}

// 初始化上下文菜单
setupNodeContextMenu();