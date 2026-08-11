import React from 'react';

export interface DesktopHeaderProps {
  telemetryRef: React.RefObject<HTMLSpanElement | null>;
  clock: string;
  activeDesktop: number;
  setActiveDesktop: (val: number) => void;
  showModes: boolean;
  setShowModes: (val: boolean) => void;
  gravityOn: boolean; setGravityOn: (v: boolean) => void;
  gravityType: 'earth' | 'moon' | 'space'; setGravityType: (v: 'earth' | 'moon' | 'space') => void;
  massMode: 'size' | 'ram'; setMassMode: (v: 'size' | 'ram') => void;
  rotationOn: boolean; setRotationOn: (v: boolean) => void;
  wobbleOn: boolean; setWobbleOn: (v: boolean) => void;
  soundOn: boolean; setSoundOn: (v: boolean) => void;
  bspTilingOn: boolean; setBspTilingOn: (v: boolean) => void;
  breakableOn: boolean; setBreakableOn: (v: boolean) => void;
  spawnWindow: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = (props) => (
  <header className="w-full px-3 pt-3 flex items-center justify-between z-30 pointer-events-auto select-none">
    <div className="px-3 py-1 bg-[#131519]/90 border border-slate-700/50 text-amber-400 font-mono text-[10px] flex items-center space-x-1.5 clip-hex-10">
      <span className="w-1.5 h-1.5 rounded-none bg-amber-400 animate-pulse" />
      <span ref={props.telemetryRef}>fwm-terminal • 0° • 0px/s • m 25.2</span>
    </div>

    <div className="px-3 py-1 bg-[#131519]/90 border border-slate-700/50 flex items-center space-x-1.5 relative clip-hex-10">
      {Array.from({ length: 10 }).map((_, i) => (
        <button
          key={i}
          onClick={() => props.setActiveDesktop(i)}
          className={`w-5 h-5 cursor-pointer flex items-center justify-center transition-all ${
            props.activeDesktop === i ? 'scale-110' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <span className={`w-2 h-2 transition-all flex items-center justify-center text-[7px] font-mono font-bold ${
            props.activeDesktop === i ? 'bg-[#e8ecf0] text-slate-950 shadow-[0_0_8px_#ffffff]' : 'bg-slate-700 text-transparent'
          }`}>
            {props.activeDesktop === i ? '•' : ''}
          </span>
        </button>
      ))}
    </div>

    <div className="flex items-center space-x-1.5 relative">
      <div className="px-2.5 py-1 bg-[#131519]/90 border border-slate-700/50 text-[#e8ecf0] font-mono text-[10px] font-bold clip-hex-8">
        <span>{props.clock || '21:42'}</span>
      </div>

      <button
        onClick={() => props.setShowModes(!props.showModes)}
        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-[10px] font-bold transition-colors cursor-pointer clip-hex-8"
      >
        ⚙ Modes
      </button>

      {props.showModes && (
        <div className="absolute top-9 right-0 w-60 bg-[#131519]/95 border border-amber-500/40 p-3 z-40 font-mono text-xs space-y-2.5 text-[#e8ecf0] clip-hex-12">
          
          <div className="flex items-center justify-between text-slate-300">
            <span>Gravity</span>
            <button onClick={() => props.setGravityOn(!props.gravityOn)} className={`fwm-btn-toggle ${props.gravityOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}>
              {props.gravityOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Preset</span>
            <div className="flex space-x-1">
              {(['earth', 'moon', 'space'] as const).map((type) => (
                <button key={type} onClick={() => { props.setGravityType(type); props.setGravityOn(type !== 'space'); }} className={`fwm-btn-segment ${props.gravityType === type && props.gravityOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Mass Mode</span>
            <div className="flex space-x-1">
              {(['size', 'ram'] as const).map((mode) => (
                <button key={mode} onClick={() => props.setMassMode(mode)} className={`fwm-btn-segment ${props.massMode === mode ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Free Rotation</span>
            <button 
              onClick={() => {
                const nextRot = !props.rotationOn;
                props.setRotationOn(nextRot);
                if (nextRot) {
                  props.setWobbleOn(false);
                }
              }} 
              className={`fwm-btn-toggle ${props.rotationOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}
            >
              {props.rotationOn ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <div className="flex items-center justify-between text-slate-300">
            <span>Wobble Jelly</span>
            <button 
              onClick={() => {
                const nextWob = !props.wobbleOn;
                props.setWobbleOn(nextWob);
                if (nextWob) {
                  props.setRotationOn(false);
                }
              }} 
              className={`fwm-btn-toggle ${props.wobbleOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}
            >
              {props.wobbleOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Collision Knock</span>
            <button onClick={() => props.setSoundOn(!props.soundOn)} className={`fwm-btn-toggle ${props.soundOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}>{props.soundOn ? 'ON' : 'OFF'}</button>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>BSP Tiling</span>
            <button onClick={() => props.setBspTilingOn(!props.bspTilingOn)} className={`fwm-btn-toggle ${props.bspTilingOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}>{props.bspTilingOn ? 'ON' : 'OFF'}</button>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Breakable Windows</span>
            <button onClick={() => props.setBreakableOn(!props.breakableOn)} className={`fwm-btn-toggle ${props.breakableOn ? 'fwm-btn-active' : 'fwm-btn-inactive'}`}>{props.breakableOn ? 'ON' : 'OFF'}</button>
          </div>

          <button onClick={props.spawnWindow} className="w-full py-1 mt-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-none cursor-pointer text-center text-[10px]">
            + Spawn Extra Window
          </button>
        </div>
      )}
    </div>
  </header>
);