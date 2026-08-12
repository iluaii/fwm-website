import type { SandboxActions, TerminalOutputLine } from '../../types/terminal';
import { resolvePathStr, getNode } from './fileSystem';

export function executeCommand(
  rawCmd: string,
  cwd: string,
  setCwd: (val: string) => void,
  sandbox: SandboxActions
): TerminalOutputLine[] {
  const trimmed = rawCmd.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const verb = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (verb === 'clear') return [{ id: Date.now().toString(), type: 'cmd', content: '__CLEAR__' }];
  if (verb === 'whoami') return [{ id: Date.now().toString(), type: 'text', content: 'ilu' }];
  if (verb === 'pwd') return [{ id: Date.now().toString(), type: 'text', content: cwd.replace('~', '/home/ilu') }];
  if (verb === 'uname') return [{ id: Date.now().toString(), type: 'text', content: 'Linux fwm-host 6.12.0-fwm #1 SMP PREEMPT_DYNAMIC Wayland x86_64 GNU/Linux' }];

  if (verb === 'help') {
    return [
      {
        id: Date.now().toString(),
        type: 'text',
        content: `Available Commands:
  fwmctl state              - Query live compositor state
  fwmctl windows            - List active windows
  fwmctl set gravity <val>  - Change gravity
  fwmctl set mass <ram|size>- Change window mass mode
  fwmctl set bsp <on|off>   - Toggle BSP tiling
  fwmctl spawn              - Spawn new window
  fwmctl kill [id]          - Close focused window
  fwmctl calm               - Stop window velocities
  cd <dir>                  - Change directory
  ls [dir]                  - List directory contents
  cat <file>                - Print file content
  pwd                       - Print working directory
  clear                     - Clear terminal`,
      },
    ];
  }

  if (verb === 'cd') {
    const target = args[0] || '~';
    const pathStr = resolvePathStr(cwd, target);
    const node = getNode(pathStr);
    
    if (!node) return [{ id: Date.now().toString(), type: 'error', content: `cd: ${target}: No such file or directory` }];
    if (node.type !== 'dir') return [{ id: Date.now().toString(), type: 'error', content: `cd: ${target}: Not a directory` }];
    
    setCwd(pathStr);
    return [];
  }

  if (verb === 'ls') {
    const target = args[0] || '.';
    const pathStr = resolvePathStr(cwd, target);
    const node = getNode(pathStr);
    
    if (!node) return [{ id: Date.now().toString(), type: 'error', content: `ls: cannot access '${target}': No such file or directory` }];
    if (node.type !== 'dir') return [{ id: Date.now().toString(), type: 'text', content: node.name }];
    
    const list = Object.keys(node.children || {}).map(k => node.children![k].type === 'dir' ? k + '/' : k).join('   ');
    return [{ id: Date.now().toString(), type: 'text', content: list || '(empty directory)' }];
  }

  if (verb === 'cat') {
    const file = args[0];
    if (!file) return [{ id: Date.now().toString(), type: 'error', content: 'cat: missing file operand' }];

    const pathStr = resolvePathStr(cwd, file);
    const node = getNode(pathStr);

    if (!node) return [{ id: Date.now().toString(), type: 'error', content: `cat: ${file}: No such file or directory` }];
    if (node.type === 'dir') return [{ id: Date.now().toString(), type: 'error', content: `cat: ${file}: Is a directory` }];
    
    return [{ id: Date.now().toString(), type: 'success', content: node.content || '' }];
  }

  if (verb === 'fwmctl') {
    const sub = args[0]?.toLowerCase();

    if (sub === 'state') return [{ id: Date.now().toString(), type: 'json', content: JSON.stringify(sandbox.getState()) }];
    if (sub === 'windows') return [{ id: Date.now().toString(), type: 'json', content: JSON.stringify(sandbox.getWindows()) }];

    if (sub === 'spawn' || (sub === 'dispatch' && args[1] === 'spawn')) {
      sandbox.spawnWindow();
      return [{ id: Date.now().toString(), type: 'success', content: '{"ok":true,"action":"spawn","spawned":true}' }];
    }

    if (sub === 'kill' || (sub === 'dispatch' && (args[1] === 'killclient' || args[1] === 'kill'))) {
      const id = args[1] && !isNaN(Number(args[1])) ? Number(args[1]) : (args[2] ? Number(args[2]) : undefined);
      sandbox.killWindow(id);
      return [{ id: Date.now().toString(), type: 'success', content: '{"ok":true,"action":"killclient"}' }];
    }

    if (sub === 'calm' || (sub === 'dispatch' && args[1] === 'calm_all')) {
      sandbox.calmAll();
      return [{ id: Date.now().toString(), type: 'success', content: '{"ok":true,"action":"calm_all"}' }];
    }

    if (sub === 'set') {
      const key = args[1]?.toLowerCase();
      const val = args[2]?.toLowerCase();

      if (key === 'gravity' || key === 'physics.gravity') {
        const num = Number(val);
        if (!isNaN(num)) {
          sandbox.setGravity(num, num === 0 ? 'space' : num <= 200 ? 'moon' : 'earth');
          return [{ id: Date.now().toString(), type: 'success', content: `{"ok":true,"name":"physics.gravity","value":"${num.toFixed(3)}"}` }];
        }
      }
      if (key === 'mass' || key === 'physics.mass') {
        if (val === 'ram' || val === 'size') {
          sandbox.setMassMode(val);
          return [{ id: Date.now().toString(), type: 'success', content: `{"ok":true,"name":"physics.mass","value":"${val}"}` }];
        }
      }
      if (key === 'bsp' || key === 'mode' || key === 'tiling') {
        const isBsp = val === 'on' || val === 'true' || val === 'tiling' || val === '1';
        sandbox.setBspTiling(isBsp);
        return [{ id: Date.now().toString(), type: 'success', content: `{"ok":true,"name":"mode","value":"${isBsp ? 'tiling' : 'physics'}"}` }];
      }
      return [{ id: Date.now().toString(), type: 'error', content: `fwmctl: unknown option '${args.slice(1).join(' ')}'` }];
    }

    return [{ id: Date.now().toString(), type: 'error', content: `fwmctl: unknown command '${sub || ''}'. Try 'help'` }];
  }

  return [{ id: Date.now().toString(), type: 'error', content: `bash: ${verb}: command not found. Type 'help' for available commands.` }];
}