import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Lock, 
  Database, 
  RefreshCw,
  Server,
  KeyRound,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export default function LandingPage() {
  const [telemetry, setTelemetry] = useState({
    status: 'checking',
    latency: null,
    cluster: 'nyxwaree.lc22vul.mongodb.net',
    dbOk: false,
  });

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const runDiagnostics = async () => {
    setTelemetry(prev => ({ ...prev, status: 'checking' }));
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      setTelemetry({
        status: data.ok ? 'operational' : 'degraded',
        latency: elapsed,
        cluster: 'nyxwaree.lc22vul.mongodb.net',
        dbOk: Boolean(data.database?.ok),
      });
    } catch (_) {
      setTelemetry({
        status: 'offline',
        latency: 999,
        cluster: 'offline',
        dbOk: false,
      });
    }
  };

  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#060709] text-[#f2f4f8] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between overflow-x-hidden safe-top safe-bottom safe-px relative">
      {/* Background Ambient Mesh Light */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[800px] h-[340px] sm:h-[600px] bg-emerald-500/5 rounded-full blur-[120px] sm:blur-[160px] animate-pulse-subtle" />
        <div className="absolute top-[40%] right-[-10%] w-[260px] sm:w-[500px] h-[260px] sm:h-[500px] bg-indigo-500/5 rounded-full blur-[100px] sm:blur-[140px]" />
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Modern Glass Header */}
      <header className="border-b border-white/[0.06] bg-[#060709]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo Mark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.1] flex items-center justify-center shadow-inner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 4L12 19L20 4" stroke="#f2f4f8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10L16 4" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-display tracking-tight text-white">NYXWARE</span>
              <span className="hidden xs:inline-block text-[10px] font-mono text-emerald-400/90 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                v2.5 PRO
              </span>
            </div>
          </div>

          {/* Right Status & Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/privacy')}
              className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 hidden sm:block"
            >
              Privacidade
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 hidden sm:block"
            >
              Termos
            </button>

            {/* Live Gateway Telemetry Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs shadow-sm">
              <span className={`w-2 h-2 rounded-full ${telemetry.dbOk ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-white/80 font-mono text-[11px] font-medium">
                {telemetry.status === 'checking' ? 'Testando...' : telemetry.dbOk ? `${telemetry.latency}ms • ATIVO` : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center relative z-10">
        {/* Hero Section */}
        <div className="max-w-3xl mb-14 sm:mb-18 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] text-white/70 mb-6 font-mono shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>DISCORD ZERO-TRUST IDENTITY PROTOCOL</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.1] mb-6">
            Infraestrutura de Identidade &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              Restauração Segura
            </span>
          </h1>

          <p className="text-sm xs:text-base sm:text-lg text-[#8a8f9c] leading-relaxed max-w-2xl font-normal">
            O gateway do <strong className="text-white font-medium">Nyxware</strong> processa autorizações OAuth2 criptografadas, assegurando recuperação instantânea de membros, cargos e dados contra incidentes no Discord.
          </p>
        </div>

        {/* Bento Grid de Arquitetura */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {/* Bento Card 1: Criptografia */}
          <div className="group relative bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] hover:border-white/[0.14] rounded-2xl sm:rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-white mb-2">Criptografia Híbrida</h3>
              <p className="text-xs text-[#8a8f9c] leading-relaxed">
                Tokens de acesso cifrados via hardware com <span className="text-white font-mono">AES-256-GCM</span> e assinaturas protegidas por <span className="text-white font-mono">HMAC-SHA256</span>.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>HARDWARE ENCRYPT</span>
              <span className="text-emerald-400/90 font-medium">ATIVO</span>
            </div>
          </div>

          {/* Bento Card 2: Cluster Atlas */}
          <div className="group relative bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] hover:border-white/[0.14] rounded-2xl sm:rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-white mb-2">Cluster Dedicado Atlas</h3>
              <p className="text-xs text-[#8a8f9c] leading-relaxed">
                Persistência redundante no cluster dedicado MongoDB Atlas com replicação contínua e backups pontuais de alta disponibilidade.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>nyxwaree.mongodb.net</span>
              <span className="text-sky-400/90 font-medium">99.99% UP</span>
            </div>
          </div>

          {/* Bento Card 3: Anti-Raid Engine */}
          <div className="group relative bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] hover:border-white/[0.14] rounded-2xl sm:rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-display text-white mb-2">Restauração Fiel</h3>
              <p className="text-xs text-[#8a8f9c] leading-relaxed">
                Recuperação automatizada de apelidos, cargos e membros em lotes orquestrados com tolerância estrita a rate-limits do Discord.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>DISCORD REST v10</span>
              <span className="text-indigo-400/90 font-medium">READY</span>
            </div>
          </div>
        </div>

        {/* Live Gateway Telemetry Panel (Fully Responsive for narrow screens) */}
        <div className="bg-[#0b0c11]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.015] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400/80" />
              <span className="text-xs font-mono font-medium text-white/80">gateway.telemetry.status</span>
            </div>
            <button
              onClick={runDiagnostics}
              className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors font-mono cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${telemetry.status === 'checking' ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">TESTAR LATÊNCIA</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 font-mono text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Callback Endpoint:</span>
              <span className="text-white/80 break-all">https://404callback.netlify.app/oauth/callback</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Interactions Endpoint:</span>
              <span className="text-white/80 break-all">https://404callback.netlify.app/api/interactions</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Cluster de Armazenamento:</span>
              <span className="text-emerald-400 break-all">{telemetry.cluster}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Latência do Edge Server:</span>
              <span className="text-white/90 font-medium">{telemetry.latency ? `${telemetry.latency} ms` : 'Medindo...'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
              <span className="text-white/40">Assinatura Criptográfica:</span>
              <span className="text-white/80">Ed25519 &amp; HMAC-SHA256 Ativas</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-xs text-white/40 safe-bottom">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white/60">NYXWARE IDENTITY ENGINE</span>
            <span>&bull;</span>
            <span>Proteção e Restauração para Comunidades</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => navigate('/privacy')}
              className="text-white/50 hover:text-white transition-colors"
            >
              PRIVACIDADE
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="text-white/50 hover:text-white transition-colors"
            >
              TERMOS
            </button>
            <button
              onClick={() => navigate('/linked-roles')}
              className="text-white/50 hover:text-white transition-colors"
            >
              LINKED ROLES
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
