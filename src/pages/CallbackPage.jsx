import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function CallbackPage() {
  const [stage, setStage] = useState('processing'); // 'processing' | 'success' | 'error'
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState(null);
  const [guildId, setGuildId] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHint, setErrorHint] = useState('');
  const [roleApplied, setRoleApplied] = useState(false);
  const hasExecutedRef = React.useRef(false);

  // Função para retornar diretamente ao aplicativo nativo do Discord (iPhone, Android e PC)
  const openNativeDiscord = (targetGuildId) => {
    const nativeUri = targetGuildId ? `discord://-/channels/${targetGuildId}` : 'discord://';
    window.location.href = nativeUri;

    // Tenta fechar a aba/in-app webview do iPhone/Android automaticamente
    setTimeout(() => {
      try {
        window.close();
      } catch (_) {}
    }, 1200);
  };

  // Efeito de retorno automático ao aplicativo nativo com contagem regressiva
  useEffect(() => {
    if (stage !== 'success' || !guildId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          openNativeDiscord(guildId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, guildId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // Se o código já foi verificado nesta aba, reutiliza para não queimar single-use do Discord
    if (code) {
      const cacheKey = `nyx_verified_${code}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUserData(parsed.user || null);
          setRoleApplied(Boolean(parsed.roleApplied));
          setGuildId(parsed.guildId || null);
          setStage('success');
          return;
        } catch (_) {}
      }
    }

    if (!code || !state) {
      setStage('error');
      setErrorMessage('Parâmetros de autorização ausentes');
      setErrorHint('O Discord não enviou o código de verificação. Retorne ao servidor e clique no botão de autorização novamente.');
      return;
    }

    // Trava de execução única (previne double-render do React 18 queimar o código de uso único)
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const processOAuth = async () => {
      try {
        // Step 1: Validando sessão
        setCurrentStep(1);
        await new Promise((r) => setTimeout(r, 320));

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

        // Salvar em cache de sessão para suportar F5/refresh sem erro
        try {
          sessionStorage.setItem(`nyx_verified_${code}`, JSON.stringify({
            user: data.user,
            roleApplied: data.roleApplied,
            guildId: data.guildId,
          }));
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (_) {}

        // Step 3: Persistência e Cargo
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 350));

        setUserData(data.user || null);
        setRoleApplied(Boolean(data.roleApplied));
        setGuildId(data.guildId || null);
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
    ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const displayName = userData?.global_name || userData?.username || 'Membro';
  const tag = userData?.username ? `@${userData.username}` : '';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#060709] text-[#f2f4f8] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between items-center px-4 py-6 sm:py-10 safe-top safe-bottom safe-px relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-emerald-500/5 rounded-full blur-[100px] sm:blur-[140px] animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-500/5 rounded-full blur-[100px] sm:blur-[130px]" />
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top Header Navigation */}
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
          <span>ZERO-TRUST GATEWAY</span>
        </div>
      </div>

      {/* Main Glassmorphic Card (Optimized for all iPhone sizes 375px - 440px) */}
      <div className="w-full max-w-[420px] my-auto relative z-10 animate-fade-in-up">
        <div className="relative bg-[#0c0d13]/80 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 xs:p-7 sm:p-8 text-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Subtle top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />

          {/* Subheader Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] mb-6">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono tracking-wider uppercase text-white/60">
              IDENTITY PROTOCOL
            </span>
          </div>

          {/* ESTADO 1: PROCESSANDO */}
          {stage === 'processing' && (
            <div className="py-2">
              <div className="relative w-14 h-14 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-md animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center text-emerald-400">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              </div>

              <h2 className="text-xl font-bold font-display tracking-tight text-white mb-2">
                Validando Autorização
              </h2>
              <p className="text-xs text-[#8a8f9c] mb-6 leading-relaxed">
                Estabelecendo canal criptográfico seguro com o Discord...
              </p>

              {/* Steps Micro-List */}
              <div className="space-y-2.5 text-left bg-black/30 border border-white/[0.05] rounded-2xl p-4 font-mono text-[11px]">
                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    currentStep >= 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </span>
                  <span className={currentStep === 1 ? 'text-white' : currentStep > 1 ? 'text-white/50' : 'text-white/20'}>
                    Troca de token Discord v10...
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    currentStep >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30'
                  }`}>
                    {currentStep > 2 ? '✓' : '2'}
                  </span>
                  <span className={currentStep === 2 ? 'text-white' : currentStep > 2 ? 'text-white/50' : 'text-white/20'}>
                    Criptografia AES-256 no Atlas...
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
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

          {/* ESTADO 2: SUCESSO LIMPO & ULTRA ELEGANTE */}
          {stage === 'success' && (
            <div className="py-1 animate-fade-in">
              {/* Profile Card Refinado */}
              {userData && (
                <div className="relative inline-block mb-5">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-xl mx-auto"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#0c0d13] border border-white/[0.1] flex items-center justify-center text-emerald-400 shadow-md">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-black stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Nome e Tag do Membro */}
              {userData && (
                <div className="mb-4">
                  <h3 className="text-base font-bold font-display text-white leading-tight">
                    {displayName}
                  </h3>
                  {tag && (
                    <span className="text-xs text-white/40 font-mono">
                      {tag}
                    </span>
                  )}
                </div>
              )}

              <h2 className="text-xl font-bold font-display tracking-tight text-white mb-2">
                Verificação Concluída
              </h2>
              <p className="text-xs text-[#8a8f9c] mb-6 leading-relaxed max-w-xs mx-auto">
                {roleApplied
                  ? 'Sua conta foi autenticada e o cargo de membro foi atribuído com sucesso no servidor.'
                  : 'Sua autorização de segurança foi salva no cluster criptográfico com sucesso.'}
              </p>

              {/* Ação Primária Otimizada para Toque em iPhone (48px height) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => openNativeDiscord(guildId)}
                  className="w-full h-12 px-5 rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] hover:from-white/[0.18] hover:to-white/[0.08] text-white text-xs sm:text-sm font-semibold font-display flex items-center justify-center gap-2.5 transition-all duration-150 border border-white/[0.12] active:scale-[0.98] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.6)] cursor-pointer"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Abrir aplicativo Discord</span>
                  {countdown > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                      {countdown}s
                    </span>
                  )}
                </button>

                <p className="text-[11px] text-white/40 font-mono">
                  {countdown > 0
                    ? `Retornando ao aplicativo nativo em ${countdown}s...`
                    : 'Pronto! Você já pode fechar esta aba.'}
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 3: ERRO HUMANIZADO */}
          {stage === 'error' && (
            <div className="py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-lg shadow-rose-500/5">
                <AlertCircle className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-xl font-bold font-display tracking-tight text-white mb-2">
                {errorMessage}
              </h2>
              <p className="text-xs text-[#8a8f9c] mb-6 leading-relaxed max-w-xs mx-auto">
                {errorHint}
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => openNativeDiscord(guildId)}
                  className="w-full h-12 px-5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-white text-xs sm:text-sm font-semibold font-display flex items-center justify-center gap-2 transition-all duration-150 border border-white/[0.08] active:scale-[0.98] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-white/60" />
                  <span>Voltar para o Discord</span>
                </button>
              </div>
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
