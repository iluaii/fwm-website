import type { WindowBody } from '../../types/physics';

// Render Sharp Flat Window Texture (Dynamic Integer Resizing & Safe Caching)
export function getWindowTextureCanvas(
  win: WindowBody,
  windowTextureMap: { [key: number]: HTMLCanvasElement },
  isFocused: boolean
): HTMLCanvasElement {
  if (!windowTextureMap[win.id]) {
    windowTextureMap[win.id] = document.createElement('canvas');
  }
  
  const texCanvas = windowTextureMap[win.id] as HTMLCanvasElement & { 
    _lastW?: number; 
    _lastH?: number; 
    _lastFocus?: boolean; 
  };
  
  // Ensure integer dimensions for HTML5 Canvas buffer
  const intW = Math.max(1, Math.round(win.w));
  const intH = Math.max(1, Math.round(win.h));

  let resized = false;
  if (texCanvas.width !== intW) {
    texCanvas.width = intW;
    resized = true;
  }
  if (texCanvas.height !== intH) {
    texCanvas.height = intH;
    resized = true;
  }

  // Cache Hit: ONLY skip redraw if the canvas was NOT resized (resizing wipes canvas bitmap)
  if (
    !resized &&
    texCanvas._lastW === intW &&
    texCanvas._lastH === intH &&
    texCanvas._lastFocus === isFocused
  ) {
    return texCanvas;
  }

  texCanvas._lastW = intW;
  texCanvas._lastH = intH;
  texCanvas._lastFocus = isFocused;

  const texCtx = texCanvas.getContext('2d');
  if (texCtx) {
    texCtx.clearRect(0, 0, intW, intH);

    // Window Background - SHARP RECTANGLE
    texCtx.fillStyle = '#0c0e14';
    texCtx.fillRect(0, 0, intW, intH);

    // Window Outer Border - Sharp 2px
    texCtx.strokeStyle = isFocused ? '#7aa2f7' : '#3b4261';
    texCtx.lineWidth = 2;
    texCtx.strokeRect(1, 1, intW - 2, intH - 2);

    // Sharp Header Titlebar
    texCtx.fillStyle = '#13151a';
    texCtx.fillRect(2, 2, intW - 4, 26);

    // Header Border Separator
    texCtx.strokeStyle = '#2ac3de';
    texCtx.lineWidth = 1;
    texCtx.beginPath();
    texCtx.moveTo(2, 28);
    texCtx.lineTo(intW - 2, 28);
    texCtx.stroke();

    // Title Text
    texCtx.fillStyle = '#7aa2f7';
    texCtx.font = 'bold 10px monospace';
    texCtx.fillText(win.title, 10, 18);

    // Window Control Dots
    texCtx.fillStyle = '#3b4261';
    texCtx.beginPath();
    texCtx.arc(intW - 36, 15, 4, 0, Math.PI * 2);
    texCtx.arc(intW - 24, 15, 4, 0, Math.PI * 2);
    texCtx.fill();

    // Red Close Button (Clickable at intW - 12)
    texCtx.fillStyle = '#f7768e';
    texCtx.beginPath();
    texCtx.arc(intW - 12, 15, 4, 0, Math.PI * 2);
    texCtx.fill();

    // CUTE ASCII CAT LOGO (Only if width is wide enough)
    if (intW >= 180 && intH >= 110) {
      texCtx.font = 'bold 11px monospace';
      texCtx.fillStyle = '#f7768e';
      texCtx.fillText('   /\\_/\\   ', 10, 68);
      texCtx.fillText('  (=^.^=)  ', 10, 82);
      texCtx.fillText('   >   <   ', 10, 90);
    }

    // System Details (Responsive layout based on tile size)
    const startX = intW >= 220 ? 100 : 10;
    const startY = intW >= 220 ? 46 : 105;

    if (intH >= 90) {
      texCtx.font = 'bold 10px monospace';
      texCtx.fillStyle = '#bb9af7';
      texCtx.fillText('ilu@fwm-host', startX, startY);
    }

    if (intW >= 190 && intH >= 130) {
      texCtx.fillStyle = '#7aa2f7';
      texCtx.fillText('OS: ', startX, startY + 20);
      texCtx.fillStyle = '#c0caf5';
      texCtx.fillText('Arch Linux', startX + 24, startY + 20);

      texCtx.fillStyle = '#7aa2f7';
      texCtx.fillText('WM: ', startX, startY + 34);
      texCtx.fillStyle = '#2ac3de';
      texCtx.fillText('fwm (Box2D 3.x)', startX + 24, startY + 34);
    }

    // Terminal Prompt (Only if tile is tall enough)
    if (intH >= 150) {
      texCtx.fillStyle = '#9ece6a';
      texCtx.fillText('➜ ', 10, intH - 18);
      texCtx.fillStyle = '#c0caf5';
      texCtx.fillText('fwmctl state --live', 24, intH - 18);
    }
  }
  return texCanvas;
}