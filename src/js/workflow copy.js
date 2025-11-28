// x6
const graph = new X6.Graph({
    container: document.getElementById('workflow-container'),
    width: 800,
    height: 800,
    autoResize: true,
    background: {
        color: '#1C1C29',
    },
    snapline: {
        enabled: true,
        sharp: true,
    },
    grid: {
        visible: true,
        type: 'doubleMesh',
        args: [
            {
                color: '#2a2a3c',
                thickness: 1,
            },
            {
                color: '#1f1f2d',
                thickness: 1,
                factor: 4,
            },
        ],
    },
    connecting: {
        snap: true,
        allowBlank: false,
        allowMulti: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        connectionPoint: 'anchor',
        router: {
            name: 'manhattan',
        },
        connector: {
            name: 'rounded',
        },
        createEdge() {
            return new X6.Shape.Edge({
                shape: 'rust-edge',
                attrs: {
                    line: {
                        stroke: '#8FBCBB',
                        strokeWidth: 2,
                        targetMarker: {
                            name: 'block',
                            size: 6,
                            fill: '#8FBCBB'
                        }
                    }
                }
            })
        },
        validateConnection({ sourceCell, targetCell, sourcePort, targetPort }) {
            // 简单的连接验证：不允许输入连接到输入，或输出连接到输出
            const sourceGroup = sourcePort && sourcePort.startsWith('input') ? 'in' : 'out'
            const targetGroup = targetPort && targetPort.startsWith('input') ? 'in' : 'out'
            return sourceGroup !== targetGroup && sourceCell !== targetCell
        }
    }
})

// 注册自定义边
X6.Graph.registerEdge(
    'rust-edge',
    {
        inherit: 'edge',
        attrs: {
            line: {
                stroke: '#8FBCBB',
                strokeWidth: 2,
                targetMarker: {
                    name: 'block',
                    size: 6,
                    fill: '#8FBCBB'
                }
            }
        }
    },
    true
)

// 注册Rust风格HTML节点
X6.Graph.registerNode(
    'rust-node',
    {
        inherit: 'html',
        width: 220,
        height: 120,
        ports: {
            groups: {
                in: {
                    position: {
                        name: 'left',
                        args: {
                            dy: 10
                        }
                    },
                    attrs: {
                        circle: {
                            r: 4,
                            magnet: true,
                            stroke: '#BF616A',
                            strokeWidth: 2,
                            fill: 'rgba(191, 97, 106, 0.2)'
                        }
                    },
                    label: {
                        position: {
                            name: 'left',
                            args: {
                                dy: -2
                            }
                        }
                    },
                    markup: [
                        {
                            tagName: 'circle',
                            selector: 'circle'
                        }
                    ]
                },
                out: {
                    position: {
                        name: 'right',
                        args: {
                            dy: 10
                        }
                    },
                    attrs: {
                        circle: {
                            r: 4,
                            magnet: true,
                            stroke: '#A3BE8C',
                            strokeWidth: 2,
                            fill: 'rgba(163, 190, 140, 0.2)'
                        }
                    },
                    label: {
                        position: {
                            name: 'right',
                            args: {
                                dy: -2
                            }
                        }
                    },
                    markup: [
                        {
                            tagName: 'circle',
                            selector: 'circle'
                        }
                    ]
                }
            },
            items: [
                { id: 'input-1', group: 'in', attrs: { circle: { 'data-port-type': 'input' } } },
                { id: 'input-2', group: 'in', attrs: { circle: { 'data-port-type': 'input' } } },
                { id: 'output-1', group: 'out', attrs: { circle: { 'data-port-type': 'output' } } },
                { id: 'output-2', group: 'out', attrs: { circle: { 'data-port-type': 'output' } } }
            ]
        },
        html: (node) => {
            const data = node.getData() || {}
            return `
                <div class="rust-node">
                    <div class="node-header">
                        <span class="node-title">${data.label || 'Rust Node'}</span>
                    </div>
                    <div class="node-body">
                        <div class="ports-group input-ports">
                            <div class="port port-input" data-port="input-1">
                                <div class="port-icon"></div>
                                <span class="port-label">Input</span>
                            </div>
                            <div class="port port-input" data-port="input-2">
                                <div class="port-icon"></div>
                                <span class="port-label">Config</span>
                            </div>
                        </div>
                        ${data.state ? `<div class="node-state">${data.state}</div>` : ''}
                        <div class="ports-group output-ports">
                            <div class="port port-output" data-port="output-1">
                                <span class="port-label">Result</span>
                                <div class="port-icon"></div>
                            </div>
                            <div class="port port-output" data-port="output-2">
                                <span class="port-label">Error</span>
                                <div class="port-icon"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        }
    },
    true
)

// 创建示例节点
function createRustNode(options = {}) {
    const defaultOptions = {
        shape: 'rust-node',
        x: 100,
        y: 100,
        data: {
            label: 'Process Data',
            state: 'Ready'
        }
    }
    
    return graph.addNode({
        ...defaultOptions,
        ...options
    })
}

// 添加一些示例节点到画布
document.addEventListener('DOMContentLoaded', function() {
    // 创建几个示例节点
    const node1 = createRustNode({
        id: 'node-1',
        x: 100,
        y: 100,
        data: {
            label: 'Data Reader',
            state: 'Idle'
        }
    })
    
    const node2 = createRustNode({
        id: 'node-2', 
        x: 400,
        y: 100,
        data: {
            label: 'Data Processor',
            state: 'Ready'
        }
    })
    
    // 添加一些示例连接
    graph.addEdge({
        shape: 'rust-edge',
        source: { cell: 'node-1', port: 'output-1' },
        target: { cell: 'node-2', port: 'input-1' },
        attrs: {
            line: {
                stroke: '#8FBCBB',
                strokeWidth: 2
            }
        }
    })
})

// 导出供其他模块使用
window.workflowGraph = graph
window.createRustNode = createRustNode

// in html

// 添加新节点的函数
function addNewRustNode() {
    const x = 100 + Math.random() * 300
    const y = 100 + Math.random() * 300
    
    window.createRustNode({
        x: x,
        y: y,
        data: {
            label: 'New Node',
            state: 'Ready'
        }
    })
}


// <div class="node-toolbar" style="position: absolute; top: 30px; left: 10px; z-index: 1000;">
//     <button onclick="addNewRustNode()" style="background: #3a5f8f; color: white; border: 1px solid #8FBCBB; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
//         + Node
//     </button>
// </div>