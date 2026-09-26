export default function App() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0F172A]/70 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              OneMoon
            </h1>
            <p className="text-xs text-sky-400 font-medium tracking-wide uppercase">
              Security Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Nominal (Scaffolding Mode)
          </span>
          <div className="h-6 w-px bg-slate-800" />
          <span className="text-xs text-slate-400">v0.1.0</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/60 border border-slate-800 p-6 md:p-8">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Platform Architecture Scaffolding Ready
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Next-Generation Threat Detection & Inbox Defense
            </h2>
            <p className="text-sm md:text-base text-slate-400 leading-relaxed">
              OneMoon orchestrates browser-level telemetry, backend heuristics, machine-learning
              inference, and immutable evidence auditing to eliminate spear-phishing and social-engineering attacks.
            </p>
          </div>
        </section>

        {/* Placeholder Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Scanned Messages', value: '0', sub: 'Awaiting telemetry feed', status: 'neutral' },
            { label: 'Active Threats Blocked', value: '0', sub: 'Heuristics standing by', status: 'safe' },
            { label: 'ML Model State', value: 'Standby', sub: 'FastAPI service online', status: 'info' },
            { label: 'Integrity Ledger', value: 'Ready', sub: 'Blockchain service scaffolded', status: 'neutral' },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition"
            >
              <p className="text-xs font-medium text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Monorepo Architecture Overview Cards */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
            Integrated Workspace Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-sky-400 font-semibold text-sm flex items-center justify-between">
                <span>Chrome Extension</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  apps/extension
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manifest V3 client for Gmail context parsing, safe link previews, and threat alerts in the browser.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-sky-400 font-semibold text-sm flex items-center justify-between">
                <span>Fastify Backend API</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  apps/api
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-performance TypeScript REST API coordinating triage pipelines, database queries, and scan orchestration.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-sky-400 font-semibold text-sm flex items-center justify-between">
                <span>FastAPI ML Service</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  apps/ml-service
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Python NLP & heuristic microservice evaluating email intent, anomaly scores, and URL reputation.
              </p>
            </div>
          </div>
        </section>

        {/* Status Activity Log placeholder */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">System Scaffolding Status</h3>
            <span className="text-xs text-slate-500 font-mono">Initialized Monorepo</span>
          </div>
          <div className="border border-slate-800/80 bg-slate-950/60 rounded-lg p-4 font-mono text-xs text-slate-400 space-y-1.5">
            <div className="text-emerald-400">[READY] Workspace configuration verified (pnpm)</div>
            <div className="text-emerald-400">[READY] Shared types package (@onemoon/types) linked</div>
            <div className="text-emerald-400">[READY] Fastify API health endpoint configured at GET /health</div>
            <div className="text-emerald-400">[READY] Python FastAPI ML service health endpoint configured at GET /health</div>
            <div className="text-emerald-400">[READY] Manifest V3 Extension boilerplate configured</div>
            <div className="text-amber-400/90">[PENDING] Threat intelligence feeds and ML inference models to be implemented</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        OneMoon Security Intelligence Platform &copy; 2026. Initial Scaffolding Build.
      </footer>
    </div>
  );
}
