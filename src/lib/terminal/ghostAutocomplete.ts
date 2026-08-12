import { resolvePathStr, getNode } from './fileSystem';

export interface TokenCompletionResult {
  ghostText: string;
  tokens: string[];
  prefix: string;
}

export function getTokenSuggestions(input: string, cwd: string): TokenCompletionResult {
  if (!input) {
    const list = ['fwmctl', 'ls', 'cat', 'cd', 'pwd', 'whoami', 'uname', 'clear', 'help'];
    return { ghostText: 'help', tokens: list, prefix: '' };
  }

  const hasTrailingSpace = input.endsWith(' ');
  const rawTokens = input.trim().split(/\s+/);
  const verb = rawTokens[0]?.toLowerCase() || '';

  let prefix = '';
  let currentWord = '';

  if (hasTrailingSpace) {
    prefix = input;
    currentWord = '';
  } else {
    const lastSpaceIdx = input.lastIndexOf(' ');
    if (lastSpaceIdx !== -1) {
      prefix = input.slice(0, lastSpaceIdx + 1);
      currentWord = input.slice(lastSpaceIdx + 1);
    } else {
      prefix = '';
      currentWord = input;
    }
  }

  let candidateTokens: string[] = [];

  if (!prefix) {
    candidateTokens = ['fwmctl', 'ls', 'cat', 'cd', 'pwd', 'whoami', 'uname', 'clear', 'help'];
  } else if (verb === 'fwmctl') {
    const sub = rawTokens[1]?.toLowerCase() || '';
    if (rawTokens.length === 1 || (rawTokens.length === 2 && !hasTrailingSpace)) {
      candidateTokens = ['state', 'windows', 'set', 'spawn', 'kill', 'calm'];
    } else if (sub === 'set') {
      if (rawTokens.length === 2 || (rawTokens.length === 3 && !hasTrailingSpace)) {
        candidateTokens = ['gravity', 'mass', 'bsp'];
      } else {
        const key = rawTokens[2]?.toLowerCase() || '';
        if (key === 'gravity' || key === 'physics.gravity') {
          candidateTokens = ['981', '0', '160'];
        } else if (key === 'mass' || key === 'physics.mass') {
          candidateTokens = ['ram', 'size'];
        } else if (key === 'bsp' || key === 'mode') {
          candidateTokens = ['on', 'off'];
        }
      }
    }
  } else if (verb === 'ls' || verb === 'cat' || verb === 'cd') {
    // Dynamic filesystem autocomplete
    const lastSlashIdx = currentWord.lastIndexOf('/');
    const pathPrefix = lastSlashIdx !== -1 ? currentWord.slice(0, lastSlashIdx + 1) : '';
    const searchPrefix = lastSlashIdx !== -1 ? currentWord.slice(lastSlashIdx + 1) : currentWord;
    
    const searchDir = resolvePathStr(cwd, pathPrefix || '.');
    const dirNode = getNode(searchDir);

    if (dirNode && dirNode.type === 'dir' && dirNode.children) {
      const children = Object.keys(dirNode.children).map(k => 
        dirNode.children![k].type === 'dir' ? k + '/' : k
      );
      
      if (verb === 'cd') {
        candidateTokens = children.filter(c => c.endsWith('/'));
      } else {
        candidateTokens = children;
      }
      
      const matches = candidateTokens.filter(t => t.toLowerCase().startsWith(searchPrefix.toLowerCase()));
      const tokens = matches.map(m => pathPrefix + m);
      
      let ghostText = '';
      if (tokens.length > 0 && currentWord) {
        ghostText = tokens[0].slice(currentWord.length);
      } else if (!currentWord && tokens.length > 0) {
        ghostText = tokens[0];
      }
      
      return { ghostText, tokens, prefix };
    }
  }

  const matches = candidateTokens.filter((t) => t.toLowerCase().startsWith(currentWord.toLowerCase()));
  const tokens = matches.length > 0 ? matches : candidateTokens;

  let ghostText = '';
  if (matches.length > 0 && currentWord) {
    ghostText = matches[0].slice(currentWord.length);
  } else if (!currentWord && candidateTokens.length > 0) {
    ghostText = candidateTokens[0];
  }

  return { ghostText, tokens, prefix };
}