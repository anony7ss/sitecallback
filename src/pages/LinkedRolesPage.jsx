import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowLeft, ExternalLink, Sparkles, Lock } from 'lucide-react';

export default function LinkedRolesPage() {
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get('success') === 'true';
  const errorMsg = params.get('error');

  const handleStartOAuth = () => {
    window.location.href = '/api/linked-roles';
  };

  const handleBackToDiscord = () => {
    window.location.href = 'discord://';
    setTimeout(() => {
      try {
        window.close();
      } catch (_) {}
    }, 1200);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#060709] text-[#f2f4f8] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between items-center px-4 py-6 sm:py-10 safe-top safe-bottom safe-px relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top Header */}
      <div className="w-full max-w-[420px] flex items-center justify-between text-xs text-white/40 font-mono py-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M4 4L12 19L20 4" stroke="#f2f4f8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 10L16 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold tracking-wider text-white/60">NYXWARE</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LINKED ROLES</span>
        </div>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-[420px] my-auto relative z-10 animate-fade-in-up">
        <div className="relative bg-[#0c0d13]/80 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 xs:p-7 sm:p-8 text-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Subtle top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />

          {/* Subheader Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] mb-6">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono tracking-wider uppercase text-white/60">
              DISCORD CONNECTION
            </span>
          </div>

          {isSuccess ? (
            <div className="py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold font-display tracking-tight text-white mb-2">
                Cargo Vinculado com Sucesso!
              </h2>
              <p className="text-xs text-[#8a8f9c] mb-6 leading-relaxed max-w-xs mx-auto">
                Seus metadados de verificação foram sincronizados com sua conta do Discord. O cargo configurado no servidor já pode ser resgatado.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleBackToDiscord}
                  className="w-full h-12 px-5 rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] hover:from-white/[0.18] hover:to-white/[0.08] text-white text-xs sm:text-sm font-semibold font-display flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.12] active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-white/70" />
                  <span>Voltar para o Discord</span>
                </button>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-lg shadow-rose-500/5">
                <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold font-display tracking-tight text-white mb-2">
                Falha na Conexão
              </h2>
              <p className="text-xs text-[#8a8f9c] mb-6 leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>

              <button
                type="button"
                onClick={handleStartOAuth}
                className="w-full h-12 px-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-white text-xs sm:text-sm font-semibold font-display flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.08] active:scale-[0.98] cursor-pointer"
              >
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : (
            <div className="py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 text-emerald-400 shadow-lg shadow-emerald-500/5">
                <Lock className="w-7 h-7" />
              </div>

              <h2 className="text-xl font-bold font-display tracking-tight text-white mb-2">
                Vincular Cargo Verificado
              </h2>
              <p className="text-xs text-[#8a8f9c] mb-6 leading-relaxed max-w-xs mx-auto">
                Este servidor requer a comprovação de identidade segura Nyxware para liberar cargos vinculados de membro.
              </p>

              <button
                type="button"
                onClick={handleStartOAuth}
                className="w-full h-12 px-5 rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] hover:from-white/[0.18] hover:to-white/[0.08] text-white text-xs sm:text-sm font-semibold font-display flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.12] active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Conectar e Verificar no Discord</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security badge footer */}
      <div className="w-full max-w-[420px] text-center py-2 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-white/30 relative z-10">
        <Lock className="w-3 h-3 text-emerald-400/60" />
        <span>NYXWARE ZERO-TRUST VERIFICATION PROTOCOL</span>
      </div>
    </div>
  );
}
