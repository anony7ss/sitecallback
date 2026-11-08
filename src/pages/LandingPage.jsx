import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Lock, 
  Cpu, 
  Database, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw,
  Server,
  KeyRound,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function LandingPage() {
  const [telemetry, setTelemetry] = useState({
    status: 'checking',
    latency: null,
    cluster: 'nyxwaree.lc22vul.mongodb.net',
    dbOk: false,
  });
  const [activeTab, setActiveTab] = useState('crypto');

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
        cluster: data.database?.cluster || 'nyxwaree.lc22vul.mongodb.net',
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
    <div className="min-h-screen bg-[#07080a] text-[#ededed] font-sans antialiased selection:bg-white/[0.08] selection:text-white flex flex-col justify-between">
      {/* Background Micro-Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#07080a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Nyxware Minimalist Logo */}
            <div className="w-7 h-7 rounded-lg bg-[#111318] border border-white/[0.1] flex items-center justify-center shadow-inner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M4 4L12 19L20 4" stroke="#ededed" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10L16 4" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">NYXWARE</span>
              <span className="text-[11px] font-mono text-white/40 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                GATEWAY v2.5
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0e1015] border border-white/[0.06] text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.dbOk ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-white/70 font-mono text-[11px]">
                {telemetry.status === 'checking' ? 'Checando...' : telemetry.dbOk ? `CLUSTER ATIVO • ${telemetry.latency}ms` : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="max-w-3xl mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.08] text-xs text-white/60 mb-6 font-mono">
            <span className="text-emerald-400">●</span>
            PROTOCOL // DISCORD OAUTH2 AUTHORIZATION ENGINE
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.15] mb-5">
            Infraestrutura de Identidade &amp; Restauração Criptográfica
          </h1>
          <p className="text-base sm:text-lg text-[#8e929b] leading-relaxed max-w-2xl font-normal">
            O gateway seguro do <span className="text-white font-medium">Nyxware</span> processa verificações autorizadas de membros, garantindo restauração instantânea de dados e imunidade contra ataques em servidores Discord.
          </p>
        </div>

        {/* Bento Grid de Arquitetura */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Bento Card 1: Criptografia */}
          <div className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6 transition-all duration-200 hover:border-white/[0.12] flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-emerald-400 mb-4">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">Criptografia Híbrida</h3>
              <p className="text-xs text-[#8e929b] leading-relaxed">
                Tokens de acesso são cifrados via hardware com <span className="text-white/80 font-mono">AES-256-GCM</span> e assinaturas efêmeras protegidas por <span className="text-white/80 font-mono">HMAC-SHA256</span>.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>ZERO-KNOWLEDGE</span>
              <span className="text-emerald-400/80">ISOLADO</span>
            </div>
          </div>

          {/* Bento Card 2: Cluster Atlas */}
          <div className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6 transition-all duration-200 hover:border-white/[0.12] flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-sky-400 mb-4">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">Cluster Nyxware Cloud</h3>
              <p className="text-xs text-[#8e929b] leading-relaxed">
                Persistência tolerante a falhas no cluster dedicado MongoDB Atlas com replicação multi-região e sincronização contínua.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>CLUSTER ATLAS</span>
              <span className="text-sky-400/80">99.99% UP</span>
            </div>
          </div>

          {/* Bento Card 3: Anti-Raid Engine */}
          <div className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6 transition-all duration-200 hover:border-white/[0.12] flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-indigo-400 mb-4">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">Restauração Fiel</h3>
              <p className="text-xs text-[#8e929b] leading-relaxed">
                Recuperação automatizada de apelidos, cargos e histórico de auditoria em lotes controlados com proteção anti-reentrância.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>RATE-LIMIT SAFE</span>
              <span className="text-indigo-400/80">RESTORE READY</span>
            </div>
          </div>
        </div>

        {/* Live Gateway Telemetry Panel */}
        <div className="bg-[#0a0b0f] border border-white/[0.07] rounded-xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs font-mono text-white/70">gateway.telemetry.status</span>
            </div>
            <button
              onClick={runDiagnostics}
              className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
            >
              <RefreshCw className={`w-3 h-3 ${telemetry.status === 'checking' ? 'animate-spin' : ''}`} />
              <span>TESTAR CONEXÃO</span>
            </button>
          </div>

          <div className="p-5 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Callback Endpoint:</span>
              <span className="text-white/80">https://404callback.netlify.app/oauth/callback</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Cluster de Armazenamento:</span>
              <span className="text-emerald-400">{telemetry.cluster}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <span className="text-white/40">Latência do Edge Server:</span>
              <span className="text-white/80">{telemetry.latency ? `${telemetry.latency} ms` : 'Medindo...'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-white/40">Assinatura de Segurança:</span>
              <span className="text-white/80">HMAC-SHA256 Token State Verification Active</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 text-xs text-white/30">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white/50">NYXWARE PROTOCOL</span>
            <span>&bull;</span>
            <span>Identidade e Segurança para Comunidades Discord</span>
          </div>
          <div className="text-[11px] font-mono text-white/20">
            SHA-256 ENCRYPTED GATEWAY
          </div>
        </div>
      </footer>
    </div>
  );
}
