import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#060709] text-[#f2f4f8] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between overflow-x-hidden safe-top safe-bottom safe-px relative">
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

      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#060709]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors font-mono cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>VOLTAR AO INÍCIO</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-white/40">POLÍTICA DE PRIVACIDADE</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 animate-fade-in-up relative z-10">
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>NYXWARE PRIVACY ASSURANCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-3">
            Política de Privacidade
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f9c] leading-relaxed">
            Última atualização: 8 de novembro de 2026. Esta política descreve com transparência como o protocolo Nyxware coleta, protege e gerencia dados no ecossistema Discord.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#8a8f9c] leading-relaxed">
          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              1. Dados Coletados
            </h2>
            <p className="mb-3">
              Ao autorizar a integração OAuth2 do Nyxware em um servidor parceiro, coletamos exclusivamente as informações públicas fornecidas pela API oficial do Discord sob o escopo <code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-white font-mono text-xs">identify</code> e <code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-white font-mono text-xs">guilds.join</code>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-white/80">
              <li>Identificador único do usuário Discord (User ID);</li>
              <li>Nome de usuário e nome de exibição público (Global Name);</li>
              <li>Hash do avatar de perfil público;</li>
              <li>Token de acesso temporário OAuth2 emitido pelo Discord.</li>
            </ul>
          </section>

          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              2. Criptografia &amp; Segurança dos Dados
            </h2>
            <p className="mb-3">
              Levamos a segurança da sua conta a sério. Nenhum token é armazenado em texto puro:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-white/80">
              <li>Todos os tokens OAuth2 são cifrados em repouso com algoritmo padrão militar <strong className="text-white font-mono">AES-256-GCM</strong>;</li>
              <li>As chaves mestras são isoladas em variáveis de ambiente na nuvem e nunca expostas publicamente;</li>
              <li>Assinaturas de requisição são validadas com <strong className="text-white font-mono">HMAC-SHA256</strong> para impedir adulteração de links;</li>
              <li>Não coletamos nem solicitamos senhas, e-mails pessoais, números de telefone ou dados de pagamento.</li>
            </ul>
          </section>

          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              3. Finalidade do Tratamento
            </h2>
            <p>
              Os dados coletados são utilizados unicamente para:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-white/80 mt-2">
              <li>Verificar a identidade do membro e aplicar cargos de proteção no servidor Discord correspondente;</li>
              <li>Permitir a reinserção automatizada da conta caso o servidor sofra um ataque (raid) com expulsão em massa.</li>
            </ul>
          </section>

          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              4. Revogação e Exclusão de Dados
            </h2>
            <p className="mb-2">
              Você tem total controle sobre seus dados e pode revogar sua autorização a qualquer momento:
            </p>
            <p className="text-white/80 mb-2">
              • No Discord: execute o comando slash <code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-white font-mono text-xs">/remoververify</code> para remover imediatamente seu token do banco de dados.
            </p>
            <p className="text-white/80">
              • No aplicativo Discord: acesse <em>Configurações de Usuário &gt; Aplicativos Autorizados</em> e revogue o acesso ao bot.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-xs text-white/30 text-center font-mono safe-bottom">
        NYXWARE PROTOCOL &bull; COMPLIANCE &amp; DATA PRIVACY
      </footer>
    </div>
  );
}
