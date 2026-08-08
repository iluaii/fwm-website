import type { WindowBody } from '../../types/physics';

// Render Sharp Flat Window Texture (NO ROUNDED CORNERS, CONSISTENT FASTFETCH/ASCII CAT)
export function getWindowTextureCanvas(
  win: WindowBody,
  windowTextureMap: { [key: number]: HTMLCanvasElement },
  isFocused: boolean
): HTMLCanvasElement {
  if (!windowTextureMap[win.id]) {
    windowTextureMap[win.id] = document.createElement('canvas');
  }
  
  // Cast with local caching properties to prevent unnecessary redraws
  const texCanvas = windowTextureMap[win.id] as HTMLCanvasElement & { _lastW?: number, _lastH?: number, _lastFocus?: boolean };
  
  if (texCanvas.width !== win.w || texCanvas.height !== win.h) {
    texCanvas.width = win.w;
    texCanvas.height = win.h;
  }

  // Cache Hit: If size and focus state haven't changed, skip the heavy canvas redraw!
  if (
    texCanvas._lastW === win.w &&
    texCanvas._lastH === win.h &&
    texCanvas._lastFocus === isFocused
  ) {
    return texCanvas;
  }

  texCanvas._lastW = win.w;
  texCanvas._lastH = win.h;
  texCanvas._lastFocus = isFocused;

  const texCtx = texCanvas.getContext('2d');
  if (texCtx) {
    texCtx.clearRect(0, 0, win.w, win.h);

    // Window Background - SHARP RECTANGLE
    texCtx.fillStyle = '#0c0e14';
    texCtx.fillRect(0, 0, win.w, win.h);

    // Window Outer Border - Sharp 2px
    texCtx.strokeStyle = isFocused ? '#7aa2f7' : '#3b4261';
    texCtx.lineWidth = 2;
    texCtx.strokeRect(1, 1, win.w - 2, win.h - 2);

    // Sharp Header Titlebar
    texCtx.fillStyle = '#13151a';
    texCtx.fillRect(2, 2, win.w - 4, 26);

    // Header Border Separator
    texCtx.strokeStyle = '#2ac3de';
    texCtx.lineWidth = 1;
    texCtx.beginPath();
    texCtx.moveTo(2, 28);
    texCtx.lineTo(win.w - 2, 28);
    texCtx.stroke();

    // Title Text
    texCtx.fillStyle = '#7aa2f7';
    texCtx.font = 'bold 10px monospace';
    texCtx.fillText(win.title, 10, 18);

    // Window Control Dots
    texCtx.fillStyle = '#3b4261';
    texCtx.beginPath();
    texCtx.arc(win.w - 36, 15, 4, 0, Math.PI * 2);
    texCtx.arc(win.w - 24, 15, 4, 0, Math.PI * 2);
    texCtx.fill();

    // Red Close Button (Clickable at win.w - 12)
    texCtx.fillStyle = '#f7768e';
    texCtx.beginPath();
    texCtx.arc(win.w - 12, 15, 4, 0, Math.PI * 2);
    texCtx.fill();

    // CUTE ASCII CAT LOGO (Pink / Rose Theme)
    texCtx.font = 'bold 11px monospace';
    texCtx.fillStyle = '#f7768e';
    texCtx.fillText('   /\\_/\\   ', 10, 68);
    texCtx.fillText('  (=^.^=)  ', 10, 82);
    texCtx.fillText('   >   <   ', 10, 90);

    // System Details
    const startX = 100;
    texCtx.fillStyle = '#bb9af7';
    texCtx.fillText('ilu@fwm-host', startX, 46);
    texCtx.fillStyle = '#3b4261';
    texCtx.fillText('------------', startX, 56);

    texCtx.fillStyle = '#7aa2f7';
    texCtx.fillText('OS: ', startX, 70);
    texCtx.fillStyle = '#c0caf5';
    texCtx.fillText('Arch Linux x86_64', startX + 24, 70);

    texCtx.fillStyle = '#7aa2f7';
    texCtx.fillText('Host: ', startX, 84);
    texCtx.fillStyle = '#c0caf5';
    texCtx.fillText('fwm Wayland WM', startX + 36, 84);

    texCtx.fillStyle = '#7aa2f7';
    texCtx.fillText('Kernel: ', startX, 98);
    texCtx.fillStyle = '#c0caf5';
    texCtx.fillText('6.12.0-fwm', startX + 48, 98);

    texCtx.fillStyle = '#7aa2f7';
    texCtx.fillText('WM: ', startX, 112);
    texCtx.fillStyle = '#2ac3de';
    texCtx.fillText('fwm (Box2D 3.x)', startX + 24, 112);

    texCtx.fillStyle = '#7aa2f7';
    texCtx.fillText('Memory: ', startX, 126);
    texCtx.fillStyle = '#c0caf5';
    texCtx.fillText('342MiB / 32GiB', startX + 48, 126);

    // Prompt
    texCtx.fillStyle = '#9ece6a';
    texCtx.fillText('➜ ', 10, 148);
    texCtx.fillStyle = '#c0caf5';
    texCtx.fillText('fwmctl state --live', 24, 148);

    texCtx.fillStyle = '#7aa2f7';
    texCtx.fillRect(144, 138, 7, 11);
  }
  return texCanvas;
}