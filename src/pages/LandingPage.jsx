import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Database, RefreshCw, CheckCircle2, Server, ExternalLink, Activity } from 'lucide-react';

export default function LandingPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [ping, setPing] = useState(null);

  const checkHealth = async () => {
    setTestingHealth(true);
    const start = performance.now();
    try {
      const res = await fetch('/.netlify/functions/oauth-health');
      const data = await res.json();
      const duration = Math.round(performance.now() - start);
      setPing(duration);
      setHealthStatus({ ok: true, data });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message });
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-white/[0.06] bg-[#0c0e14]/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white">Absolute Security</span>
              <span className="text-xs text-white/40 ml-2 hidden sm:inline">Gateway & Restauração</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow"></span>
              <span className="text-white/80">Sistemas Operacionais</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center animate-fade-in">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white/70 mb-6">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Infraestrutura Criptografada AES-256-GCM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-5 leading-tight">
            Autenticação Segura &amp; Restauração de Membros
          </h1>
          <p className="text-base sm:text-lg text-white/60 leading-relaxed font-normal">
            Esta aplicação atua como ponte oficial de autorização OAuth2 para o sistema de proteção e recuperação automatizada do seu servidor Discord.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          <div className="bg-[#0f1118] border border-white/[0.07] rounded-xl p-6 transition-all duration-200 hover:border-white/[0.15]">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/80 mb-5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">OAuth2 Oficial</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Integração nativa com a API do Discord v10, garantindo verificação sem senhas e em total conformidade com os Termos de Serviço.
            </p>
          </div>

          <div className="bg-[#0f1118] border border-white/[0.07] rounded-xl p-6 transition-all duration-200 hover:border-white/[0.15]">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/80 mb-5">
              <RefreshCw className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Restauração Anti-Raid</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Em situações de ataque ou remoção indevida de membros, permite restaurar usuários, cargos e permissões com integridade.
            </p>
          </div>

          <div className="bg-[#0f1118] border border-white/[0.07] rounded-xl p-6 transition-all duration-200 hover:border-white/[0.15]">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/80 mb-5">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Cloud Isolada</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Armazenamento em cluster seguro MongoDB Atlas com isolamento rigoroso por servidor e chaves de segurança protegidas.
            </p>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-5 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Status do Endpoint</span>
            </div>
            <button
              onClick={checkHealth}
              disabled={testingHealth}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
              <span>Verificar</span>
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/[0.05] text-xs">
            <span className="text-white/50">Callback URL</span>
            <code className="bg-white/[0.04] px-2 py-0.5 rounded text-white/80 font-mono text-[11px]">/oauth/callback</code>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/[0.05] text-xs">
            <span className="text-white/50">Servidor Edge / Latência</span>
            <span className="text-emerald-400 font-medium">
              {ping ? `${ping}ms • Netlify Edge` : 'Checando...'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/[0.05] text-xs">
            <span className="text-white/50">Disponibilidade</span>
            <span className="text-white/90 font-medium">99.98% operacional</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-white/40">
        <p>Absolute Security Gateway &bull; Proteção inteligente para comunidades no Discord</p>
      </footer>
    </div>
  );
}
