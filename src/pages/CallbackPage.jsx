import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function CallbackPage() {
  const [stage, setStage] = useState('processing'); // 'processing' | 'success' | 'error'
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [roleApplied, setRoleApplied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      setStage('error');
      setErrorMessage('O Discord não enviou os parâmetros de autorização necessários. Gere um novo link no servidor.');
      return;
    }

    const processOAuth = async () => {
      try {
        // Step 1: Iniciando
        setCurrentStep(1);
        await new Promise((r) => setTimeout(r, 400));

        // Step 2: Criptografia e Estado
        setCurrentStep(2);

        const response = await fetch(`/api/oauth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Fallback se a função retornou HTML
          const text = await response.text();
          if (response.ok) {
            data = { success: true };
          } else {
            throw new Error('Falha na autorização. Verifique as configurações do servidor.');
          }
        }

        if (!response.ok || data.success === false) {
          throw new Error(data.message || data.error || 'Não foi possível concluir a autorização. Tente gerar um novo link.');
        }

        // Step 3: Sincronização
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 450));

        setUserData(data.user || null);
        setRoleApplied(Boolean(data.roleApplied));
        setStage('success');
      } catch (err) {
        setStage('error');
        setErrorMessage(err.message || 'Erro inesperado durante a comunicação com os servidores.');
      }
    };

    processOAuth();
  }, []);

  const avatarUrl = userData?.avatar
    ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const displayName = userData?.global_name || userData?.username || 'Membro';
  const tag = userData?.username ? `@${userData.username}` : '';

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f4f5f8] flex items-center justify-center p-6 selection:bg-white/10 selection:text-white">
      <div className="w-full max-w-[420px] animate-fade-in">
        {/* Card Principal */}
        <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle glow highlight behind card */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

          {/* ESTADO 1: PROCESSANDO COM STEPS */}
          {stage === 'processing' && (
            <div className="py-4">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 text-white/80">
                <Loader2 className="w-7 h-7 animate-spin text-white/70" />
              </div>

              <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
                Processando Autorização
              </h2>
              <p className="text-xs text-white/50 mb-8 leading-relaxed">
                Conectando ao gateway do Discord e validando suas credenciais de segurança.
              </p>

              {/* Stepper elegante */}
              <div className="space-y-3 text-left bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mb-2">
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                    currentStep >= 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </div>
                  <span className={currentStep === 1 ? 'text-white font-medium' : currentStep > 1 ? 'text-white/60' : 'text-white/30'}>
                    Validando permissões OAuth2...
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                    currentStep >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep > 2 ? '✓' : '2'}
                  </div>
                  <span className={currentStep === 2 ? 'text-white font-medium' : currentStep > 2 ? 'text-white/60' : 'text-white/30'}>
                    Criptografando tokens com AES-256...
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                    currentStep >= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep >= 3 ? '✓' : '3'}
                  </div>
                  <span className={currentStep === 3 ? 'text-white font-medium' : 'text-white/30'}>
                    Sincronizando cargo de membro...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ESTADO 2: SUCESSO ELEGANTE */}
          {stage === 'success' && (
            <div className="py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6 text-emerald-400">
                <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* User Pill */}
              {userData && (
                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-white block leading-none">{displayName}</span>
                    {tag && <span className="text-[10px] text-white/40 block leading-none mt-0.5">{tag}</span>}
                  </div>
                </div>
              )}

              <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
                Verificação Concluída
              </h2>
              <p className="text-sm text-white/60 mb-6 leading-relaxed font-normal">
                {roleApplied
                  ? 'Sua conta foi validada e seu cargo de membro foi aplicado com sucesso no servidor.'
                  : 'Sua autorização foi vinculada com segurança ao sistema de proteção de membros.'}
              </p>

              <div className="space-y-3">
                <a
                  href="discord://"
                  className="w-full py-3 px-4 rounded-xl bg-[#232733] hover:bg-[#2b3040] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-150 border border-white/[0.1] active:scale-[0.99] shadow-lg"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Voltar para o Discord</span>
                </a>

                <p className="text-[11px] text-white/40">
                  Você já pode fechar esta aba com segurança.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 3: ERRO LIMPO */}
          {stage === 'error' && (
            <div className="py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6 text-rose-400">
                <AlertCircle className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
                Falha na Autorização
              </h2>
              <p className="text-sm text-white/60 mb-6 leading-relaxed font-normal">
                {errorMessage}
              </p>

              <div className="space-y-3">
                <a
                  href="discord://"
                  className="w-full py-3 px-4 rounded-xl bg-[#1c202a] hover:bg-[#252b38] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-white/[0.08]"
                >
                  <ArrowLeft className="w-4 h-4 text-white/70" />
                  <span>Voltar para o Discord</span>
                </a>

                <p className="text-[11px] text-white/40">
                  Gere um novo link no canal de verificação e tente novamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security badge below card */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-xs text-white/30">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" />
          <span>Protegido por Absolute Security Protocol</span>
        </div>
      </div>
    </div>
  );
}
