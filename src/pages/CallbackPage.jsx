import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function CallbackPage() {
  const [stage, setStage] = useState('processing'); // 'processing' | 'success' | 'error'
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHint, setErrorHint] = useState('');
  const [roleApplied, setRoleApplied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      setStage('error');
      setErrorMessage('Parâmetros de autorização ausentes');
      setErrorHint('O Discord não enviou o código de verificação. Retorne ao servidor e clique no botão de autorização novamente.');
      return;
    }

    const processOAuth = async () => {
      try {
        // Step 1: Validando sessão
        setCurrentStep(1);
        await new Promise((r) => setTimeout(r, 350));

        // Step 2: Criptografia e Estado
        setCurrentStep(2);

        const response = await fetch(`/api/oauth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.success === false) {
          const rawErr = data?.error || 'Falha na validação das credenciais com o Discord.';
          let friendly = rawErr;
          let hint = 'Gere um novo link de autorização no canal do Discord.';

          if (rawErr.includes('invalid_grant') || rawErr.includes('expirou')) {
            friendly = 'Link de autorização expirado ou já utilizado';
            hint = 'Por motivos de segurança do Discord, cada link de autorização só pode ser validado uma única vez. Volte ao Discord e clique em Verificar novamente para gerar um link novo.';
          } else if (rawErr.includes('redirect_uri')) {
            friendly = 'Incompatibilidade de redirecionamento';
            hint = 'O URI de callback foi atualizado. Clique no botão de verificação novamente no Discord para usar o endereço correto.';
          }

          setErrorMessage(friendly);
          setErrorHint(hint);
          setStage('error');
          return;
        }

        // Step 3: Persistência e Cargo
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 400));

        setUserData(data.user || null);
        setRoleApplied(Boolean(data.roleApplied));
        setStage('success');
      } catch (err) {
        setStage('error');
        setErrorMessage('Erro de comunicação com o gateway');
        setErrorHint('Não foi possível conectar ao servidor de autenticação. Verifique sua conexão e tente novamente.');
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
        {/* Card Principal */}
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
              NYXWARE // IDENTITY ENGINE
            </span>
          </div>

          {/* ESTADO 1: PROCESSANDO COM STEPS */}
          {stage === 'processing' && (
            <div className="py-2">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-5 text-white/70">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                Validando Autorização
              </h2>
              <p className="text-xs text-[#8e929b] mb-6 leading-relaxed">
                Comunicação segura com a API do Discord v10 em andamento.
              </p>

              {/* Stepper minimalista */}
              <div className="space-y-2.5 text-left bg-black/20 border border-white/[0.04] rounded-xl p-3.5 mb-2 font-mono text-[11px]">
                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    currentStep >= 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </span>
                  <span className={currentStep === 1 ? 'text-white' : currentStep > 1 ? 'text-white/50' : 'text-white/20'}>
                    Troca de token Discord v10...
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    currentStep >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep > 2 ? '✓' : '2'}
                  </span>
                  <span className={currentStep === 2 ? 'text-white' : currentStep > 2 ? 'text-white/50' : 'text-white/20'}>
                    Criptografia AES-256 no Atlas...
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    currentStep >= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep >= 3 ? '✓' : '3'}
                  </span>
                  <span className={currentStep === 3 ? 'text-white' : 'text-white/20'}>
                    Sincronização de permissões...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ESTADO 2: SUCESSO LIMPO */}
          {stage === 'success' && (
            <div className="py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>

              {/* User Identity Pill */}
              {userData && (
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-4">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div className="text-left">
                    <span className="text-xs font-medium text-white block leading-none">{displayName}</span>
                    {tag && <span className="text-[10px] text-white/40 font-mono block leading-none mt-0.5">{tag}</span>}
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                Verificação Concluída
              </h2>
              <p className="text-xs text-[#8e929b] mb-6 leading-relaxed">
                {roleApplied
                  ? 'Sua conta foi verificada e seu cargo de membro foi atribuído no servidor.'
                  : 'Sua autorização de restauração foi salva com sucesso no cluster de segurança.'}
              </p>

              <div className="space-y-3">
                <a
                  href="discord://"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.1] active:scale-[0.99]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Voltar para o Discord</span>
                </a>

                <p className="text-[11px] text-white/30 font-mono">
                  Sessão gravada. Você já pode fechar esta aba.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 3: ERRO HUMANIZADO */}
          {stage === 'error' && (
            <div className="py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                {errorMessage}
              </h2>
              <p className="text-xs text-[#8e929b] mb-6 leading-relaxed">
                {errorHint}
              </p>

              <div className="space-y-3">
                <a
                  href="discord://"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-white/[0.08]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
                  <span>Voltar para o Discord</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="text-center mt-5 flex items-center justify-center gap-1.5 text-[11px] font-mono text-white/30">
          <Lock className="w-3 h-3 text-emerald-400/60" />
          <span>NYXWARE ZERO-TRUST VERIFICATION PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}
