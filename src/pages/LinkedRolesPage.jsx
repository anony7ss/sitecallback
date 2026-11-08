import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowLeft, ExternalLink, Sparkles, Lock } from 'lucide-react';

export default function LinkedRolesPage() {
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get('success') === 'true';
  const errorMsg = params.get('error');

  const handleStartOAuth = () => {
    window.location.href = '/api/linked-roles';
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-[#ededed] font-sans antialiased selection:bg-white/[0.08] selection:text-white flex items-center justify-center p-6">
      {/* Background Micro-Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        <div className="bg-[#0c0d12] border border-white/[0.08] rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Top Brand Tag */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-5 h-5 rounded bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M4 4L12 19L20 4" stroke="#ededed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10L16 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-white/40">
              DISCORD // LINKED ROLES VERIFICATION
            </span>
          </div>

          {isSuccess ? (
            <div className="py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                Cargo Vinculado com Sucesso!
              </h2>
              <p className="text-xs text-[#8e929b] mb-6 leading-relaxed">
                Seus metadados de verificação foram sincronizados com sua conta do Discord. O cargo configurado no servidor já pode ser reivindicado.
              </p>

              <div className="space-y-3">
                <a
                  href="discord://"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.1] active:scale-[0.99]"
                >
                  <span>Voltar para o Discord</span>
                </a>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                Falha na Conexão
              </h2>
              <p className="text-xs text-[#8e929b] mb-6 leading-relaxed">
                {errorMsg}
              </p>

              <button
                onClick={handleStartOAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.1]"
              >
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : (
            <div className="py-2">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-5 text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                Vincular Cargo Verificado
              </h2>
              <p className="text-xs text-[#8e929b] mb-6 leading-relaxed">
                Este servidor requer a comprovação de identidade segura Nyxware para liberar cargos especiais vinculados.
              </p>

              <button
                onClick={handleStartOAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.1] active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Conectar e Verificar no Discord</span>
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-5 flex items-center justify-center gap-1.5 text-[11px] font-mono text-white/30">
          <ShieldCheck className="w-3 h-3 text-emerald-400/60" />
          <span>NYXWARE ROLE CONNECTIONS PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}
