import { useState } from 'react';
import { Terminal, Code2, Layers, ExternalLink, ArrowUpRight } from 'lucide-react';

export default function Welcome({ onDismiss }) {
  const [activeTab, setActiveTab] = useState('structure');

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-mono antialiased selection:bg-orange-500 selection:text-white flex flex-col">
      
      {/* SYSTEM TOP BAR */}
      <header className="border-b-2 border-slate-900 bg-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-orange-600 rounded-none border border-slate-900 animate-pulse" />
              <span className="font-black text-sm tracking-tighter uppercase">
                INNEWGEN // SYSTEM_INIT
              </span>
            </div>
            <span className="hidden sm:inline text-xs text-slate-400 bg-slate-100 px-2 py-0.5 border border-slate-200">
              ENVIRONMENT: READY
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href="https://innewgen.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-orange-600 transition-colors border-b border-transparent hover:border-orange-600 font-bold">
              INNEWGEN.COM <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE SPLIT */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT COLUMN: CONTROL & STATUS LOG */}
        <aside className="w-full md:w-[380px] border-b-2 md:border-b-0 md:border-r-2 border-slate-900 bg-white flex flex-col justify-between">
          <div className="p-6">
            <div className="mb-8">
              <span className="text-xs font-bold text-orange-600 block mb-2">// CODENAME</span>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">
                Scaffold<br />Complete.
              </h1>
            </div>

            {/* LIVE CONSOLE DIAGNOSTIC */}
            <div className="border border-slate-300 bg-slate-50 p-4 mb-6">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">
                <span>Diagnostic Stream</span>
                <span className="text-emerald-600">● LIVE</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="flex items-start gap-2">
                  <span className="text-slate-400">01</span> 
                  <span>Engine: Vite v5.0 + React</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-slate-400">02</span>
                  <span className="text-slate-900 font-bold">✓ HMR pipeline connected</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-slate-400">03</span>
                  <span>Port mapping allocation: OK</span>
                </p>
              </div>
            </div>

            {/* ACTION PIPELINE */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">// Execution Scripts</span>
              <div className="p-3 bg-white border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">npm run dev</p>
                  <p className="text-slate-500 text-[11px]">Starts regional dev server</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-300 px-1.5 py-0.5 font-bold">RUNNING</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 flex items-center justify-between text-xs grayscale hover:grayscale-0 transition-all">
                <div>
                  <p className="font-bold text-slate-700">npm run build</p>
                  <p className="text-slate-400 text-[11px]">Compiles static deployment blocks</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5">STANDBY</span>
              </div>
            </div>
          </div>

          {/* ASIDE FOOTER */}
          <div className="p-6 border-t border-slate-200 bg-slate-50/50 hidden md:block">
            <p className="text-[11px] text-slate-500 leading-normal">
              This terminal matrix page is part of the INNEWGEN automated engineering pipeline.
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN: DIRECTORIES & DOCS INTERFACE */}
        <main className="flex-1 bg-[#F5F5F5] flex flex-col">
          
          {/* TAB BAR NAV */}
          <nav className="flex border-b border-slate-900 bg-white">
            <button 
              onClick={() => setActiveTab('structure')}
              className={`px-6 py-4 text-xs font-bold border-r border-slate-900 uppercase flex items-center gap-2 transition-all ${activeTab === "structure" ? "bg-[#F5F5F5] text-orange-600 border-b-2 border-b-orange-600" : "bg-white text-slate-500 hover:text-slate-900"}`}
            >
              <Layers className="w-3.5 h-3.5" /> File Architecture
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`px-6 py-4 text-xs font-bold border-r border-slate-900 uppercase flex items-center gap-2 transition-all ${activeTab === "docs" ? "bg-[#F5F5F5] text-orange-600 border-b-2 border-b-orange-600" : "bg-white text-slate-500 hover:text-slate-900"}`}
            >
              <Code2 className="w-3.5 h-3.5" /> Dependency Map
            </button>
          </nav>

          {/* TAB CONTENT VIEWER */}
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-between">
            <div>
              
              {/* HERO DESCRIPTION SECTION */}
              <div className="max-w-2xl mb-12">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-6 uppercase leading-tight">
                  Your project build environment has been successfully mapped.
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Generated instantly via the{' '}
                  <span className="inline-block bg-gradient-to-r from-orange-600 to-red-500 text-white font-black px-2 py-0.5 text-xs sm:text-sm border border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] tracking-wide transform -translate-y-0.5">
                    INNEWGEN CLI
                  </span>
                  . This workspace contains a fully localized React + Vite architecture optimized for instantaneous local file hot-swapping and pipeline deployment.
                </p>
              </div>

              {activeTab === 'structure' ? (
                <div className="space-y-4">
                  <div className="border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                    <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
                      <span className="font-bold">FILE_TREE // ROOT</span>
                      <span className="opacity-40">UTF-8</span>
                    </div>
                    <pre className="p-4 text-xs text-slate-800 bg-white overflow-x-auto leading-relaxed">
{`src/
├── components/       # Standalone interface nodes
├── pages/            # Layout views / routing anchors
├── hooks/            # Isolated state controllers
├── services/         # API abstraction layers
├── utils/            # Absolute functional calculations
├── App.jsx           # Core framework orchestration shell
└── main.jsx          # Client hardware pipeline hook`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-900 bg-white split-rows divide-y divide-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <DocRow title="React Hub" desc="Standard UI rendering engine documentation" url="https://react.dev" />
                    <DocRow title="Vite Pipeline" desc="Native ESM build tool & config specs" url="https://vite.dev" />
                    <DocRow title="Tailwind Engine" desc="Utility architecture class mapping" url="https://tailwindcss.com" />
                  </div>
                </div>
              )}
            </div>

            {/* INTERFACIAL FOOTER ALERTS */}
            <div className="mt-12 pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Terminal className="w-4 h-4 text-orange-600" />
                <span>Ready to execute local commands. Shell operational.</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[11px] font-bold text-slate-400">
                  INNEWGEN_CLI // TERMINATION_LOCK_0
                </div>
                <button
                  onClick={onDismiss}
                  className="text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all"
                >
                  CONTINUE →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DocRow({ title, desc, url }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer" 
      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-orange-50 group transition-colors"
    >
      <div>
        <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors flex items-center gap-1">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-slate-400 border border-slate-300 px-2 py-1 bg-white group-hover:border-orange-500 group-hover:text-orange-600 uppercase flex items-center gap-1 shrink-0 self-start sm:self-center">
        FETCH REFERENCE <ExternalLink className="w-2.5 h-2.5" />
      </span>
    </a>
  );
}
