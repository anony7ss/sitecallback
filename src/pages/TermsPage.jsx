import React from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
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
            <span className="text-xs font-mono text-white/40">TERMOS DE SERVIÇO</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 animate-fade-in">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.02] border border-white/[0.08] text-xs text-emerald-400 font-mono mb-4">
            <FileText className="w-3.5 h-3.5" />
            LEGAL // USER AGREEMENT
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            Termos de Serviço
          </h1>
          <p className="text-sm text-[#8e929b] leading-relaxed">
            Ao conectar sua conta do Discord através do protocolo Nyxware, você concorda expressamente com os seguintes termos e condições de uso.
          </p>
        </div>

        <div className="space-y-8 text-sm text-[#8e929b] leading-relaxed">
          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao utilizar os recursos de verificação e autorização OAuth2 fornecidos pelo bot e gateway Nyxware, você confirma que leu, compreendeu e concorda em cumprir estes termos e as Diretrizes da Comunidade do Discord.
            </p>
          </section>

          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              2. Escopo do Serviço
            </h2>
            <p className="mb-2">
              O serviço fornecido consiste em:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-white/80">
              <li>Validação de entrada e atribuição automatizada de cargos pré-configurados pela moderação do servidor;</li>
              <li>Manutenção de um registro de restauração seguro para reinserir membros genuínos em caso de exclusão acidental ou ataques de terceiros mal-intencionados.</li>
            </ul>
          </section>

          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              3. Uso Aceitável &amp; Conduta Proibida
            </h2>
            <p className="mb-2">
              É estritamente proibido:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 text-white/80">
              <li>Tentar adulterar assinaturas criptográficas de estado (<code className="bg-white/[0.05] px-1.5 py-0.5 rounded text-white font-mono text-xs">state</code>) ou forjar autorizações;</li>
              <li>Utilizar automações, bots maliciosos ou scripts para sobrecarregar a infraestrutura do gateway;</li>
              <li>Explorar qualquer vulnerabilidade técnica para fins maliciosos.</li>
            </ul>
          </section>

          <section className="bg-[#0c0d12] border border-white/[0.06] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              4. Limitação de Responsabilidade
            </h2>
            <p>
              O protocolo Nyxware opera em conformidade com as APIs e políticas públicas do Discord. O serviço é oferecido &ldquo;como está&rdquo;, sem garantias implícitas de disponibilidade ininterrupta decorrente de instabilidades de terceiros ou manutenções na rede do Discord.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-6 text-xs text-white/30 text-center font-mono">
        NYXWARE PROTOCOL &bull; TERMS OF SERVICE
      </footer>
    </div>
  );
}
