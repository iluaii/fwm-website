import React, { useState } from 'react';

import { ProximityText } from 'z-proximity-engine';

export const InstallSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');

  const quickCommand = "curl -sL https://fwm-website.vercel.app/install-fwm.sh | bash";
  const manualCommand = "git clone https://github.com/iluaii/fwm.git\ncd fwm\n./install.sh";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mode === 'quick' ? quickCommand : manualCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" className="relative z-10 pt-2 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
      <div className="p-[1px] bg-gradient-to-r from-amber-500/30 via-amber-400/60 to-amber-500/30 shadow-[0_0_40px_rgba(208,168,44,0.15)] transition-all duration-300 mx-auto clip-hex-40">
        <div className="bg-slate-900/95 backdrop-blur-md p-10 sm:p-14 space-y-8 flex flex-col items-center clip-hex-40">
          <div className="space-y-4">
            <h2 className="fwm-title text-3xl sm:text-5xl drop-shadow-md">
              Ready to experience{' '}
              <span className="inline-block">
                <ProximityText
                  text="fwm?"
                  preset="tiltCard-magnetic-opacity-glow"
                  textClassName="fwm-prox-text px-1"
                  reach={2}
                  duration={1}
                  opacity={[0.7, 1]}
                  glow={[0, 6]}
                  ease="elastic"
                  splitBy="letter"
                />
              </span>
            </h2>
            <p className="fwm-desc text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              Choose your preferred installation method. Supported on Arch, Debian/Ubuntu, Fedora, NixOS, and Void Linux.
            </p>
          </div>

          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setMode('quick')}
              className={`px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all ${mode === 'quick' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Quick Install
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all ${mode === 'manual' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Manual Install
            </button>
          </div>

          <div className="relative group w-full max-w-2xl text-left">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-300/20 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-950 border border-slate-800 group-hover:border-amber-500/50 p-4 rounded-xl transition-colors">
              <div className="flex flex-col space-y-1 overflow-x-auto whitespace-pre pl-2 text-amber-300/90 font-mono text-xs sm:text-sm w-full">
                {mode === 'quick' ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-600 select-none">$</span>
                    <span>{quickCommand}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3"><span className="text-slate-600 select-none">$</span><span>git clone https://github.com/iluaii/fwm.git</span></div>
                    <div className="flex items-center space-x-3"><span className="text-slate-600 select-none">$</span><span>cd fwm</span></div>
                    <div className="flex items-center space-x-3"><span className="text-slate-600 select-none">$</span><span>./install.sh</span></div>
                  </>
                )}
              </div>

              <button
                onClick={copyToClipboard}
                className="mt-4 sm:mt-0 sm:ml-4 shrink-0 flex items-center justify-center bg-slate-800 hover:bg-amber-400 text-slate-300 hover:text-slate-950 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};