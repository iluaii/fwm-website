import type { FileNode } from '../../types/terminal';

export const VIRTUAL_FS: Record<string, FileNode> = {
  '~': {
    name: '~',
    type: 'dir',
    children: {
      '.config': {
        name: '.config',
        type: 'dir',
        children: {
          fwm: {
            name: 'fwm',
            type: 'dir',
            children: {
              'config.toml': {
                name: 'config.toml',
                type: 'file',
                content: `# fwm compositor configuration\n[physics]\ngravity = 981.0\nfriction = 0.985\nmass = "size"\nrestitution = 0.3\nmax_throw_speed = 1800.0\n\n[binds]\n"super+Return" = "terminal"\n"super+q" = "killclient"\n"super+g" = "cycle_gravity"`,
              },
            },
          },
        },
      },
      docs: {
        name: 'docs',
        type: 'dir',
        children: {
          'architecture.md': {
            name: 'architecture.md',
            type: 'file',
            content: `# fwm Architecture\n- C11 Wayland compositor built on wlroots 0.20\n- Box2D 3.x physics mirror in src/physics.c\n- Single-threaded event loop + PipeWire audio threads\n- Zero-drift IPC via UNIX domain sockets`,
          },
          'getting-started.md': {
            name: 'getting-started.md',
            type: 'file',
            content: `# Getting Started\nClone: git clone https://github.com/iluaii/fwm.git\nBuild: ./install.sh\nRun: fwm`,
          },
        },
      },
      secrets: {
        name: 'secrets',
        type: 'dir',
        children: {
          'easter_egg.txt': {
            name: 'easter_egg.txt',
            type: 'file',
            content: `🎉 You found the fwm terminal secret!\n\nfwm was crafted with real rigid-body physics in mind. Try running:\n  fwmctl set gravity 0\n  fwmctl set mass ram\n  fwmctl spawn\n\nEnjoy the zero-g floating windows! 🚀`,
          },
        },
      },
      'README.md': {
        name: 'README.md',
        type: 'file',
        content: `# fwm - Physics Window Manager for Wayland\nOfficial live demo environment. Type "help" for a list of commands.`,
      },
    },
  },
};

export function resolvePathStr(cwd: string, target: string): string {
  let p = target;
  if (p.startsWith('~')) {
    // absolute from home
  } else if (p.startsWith('/')) {
    p = '~' + p; // treat / as ~ for this sandbox
  } else {
    p = cwd + '/' + p; // relative
  }

  const parts = p.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (stack.length > 1) stack.pop(); // don't go above ~
    } else {
      stack.push(part);
    }
  }
  return stack.length === 0 ? '~' : stack.join('/');
}

export function getNode(pathStr: string): FileNode | null {
  const parts = pathStr.split('/');
  if (parts[0] !== '~') return null;
  let curr: FileNode = VIRTUAL_FS['~'];
  
  for (let i = 1; i < parts.length; i++) {
    if (curr.type !== 'dir' || !curr.children || !curr.children[parts[i]]) return null;
    curr = curr.children[parts[i]];
  }
  return curr;
}