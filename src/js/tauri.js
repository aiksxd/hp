const { Command } = window.__TAURI__.shell;
const { exists, BaseDirectory } = window.__TAURI__.fs;

async function executeShellCommand(commandString) {
    const ua = navigator.userAgent.toLowerCase();
    let args;

    if (ua.includes('win')) {
        // 使用配置中允许的 “cmd” 或 “powershell”
        window.shell = 'cmd';
        args = ['/c', commandString]; // 或使用 powershell: ['-Command', commandString]
    } else if (ua.includes('mac') || ua.includes('darwin')) {
        window.shell = 'zsh';
        args = ['-c', commandString];
    } else if (ua.includes('linux')) {
        window.shell = 'bash';
        args = ['-c', commandString];
    } else {
        return 'unknown platform'
    }

    const cmd = Command.create(shell, args);
    const output = await cmd.execute();
    console.log('shell: ', output)
    return output;
}