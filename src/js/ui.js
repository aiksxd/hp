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
