import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

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
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VOLTAR AO INÍCIO</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">POLÍTICA DE PRIVACIDADE</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 animate-fade-in">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.08] text-xs text-emerald-400 font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            NYXWARE PRIVACY ASSURANCE
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            Política de Privacidade
          </h1>
          <p className="text-sm text-[#8e929b] leading-relaxed">
            Última atualização: 8 de novembro de 2026. Esta política descreve como o protocolo Nyxware coleta, protege e gerencia dados de usuários no ecossistema Discord.
          </p>
        </div>

        <div className="space-y-8 text-sm text-[#8e929b] leading-relaxed">
          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
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

          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              2. Criptografia &amp; Segurança dos Dados
            </h2>
            <p className="mb-3">
              Levamos a segurança da sua conta a sério. Nenhum token é armazenado em texto puro:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-white/80">
              <li>Todos os tokens OAuth2 são cifrados em repouso com algoritmo padrão militar <strong className="text-white">AES-256-GCM</strong>;</li>
              <li>As chaves mestras são isoladas em variáveis de ambiente na nuvem e nunca expostas publicamente;</li>
              <li>Assinaturas de requisição são validadas com <strong className="text-white">HMAC-SHA256</strong> para impedir adulteração de links;</li>
              <li>Não coletamos nem solicitamos senhas, e-mails pessoais, números de telefone ou dados de pagamento.</li>
            </ul>
          </section>

          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
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

          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
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
      <footer className="border-t border-white/[0.05] py-6 text-xs text-white/30 text-center font-mono">
        NYXWARE PROTOCOL &bull; COMPLIANCE &amp; DATA PRIVACY
      </footer>
    </div>
  );
}
