import React from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#060709] text-[#f2f4f8] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between overflow-x-hidden safe-top safe-bottom safe-px relative">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
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
            <span className="text-[11px] font-mono text-white/40">TERMOS DE SERVIÇO</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 animate-fade-in-up relative z-10">
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-mono mb-4">
            <FileText className="w-4 h-4" />
            <span>LEGAL // USER AGREEMENT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white mb-3">
            Termos de Serviço
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8f9c] leading-relaxed">
            Ao conectar sua conta do Discord através do protocolo Nyxware, você concorda expressamente com os seguintes termos e condições de uso.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#8a8f9c] leading-relaxed">
          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao utilizar os recursos de verificação e autorização OAuth2 fornecidos pelo bot e gateway Nyxware, você confirma que leu, compreendeu e concorda em cumprir estes termos e as Diretrizes da Comunidade do Discord.
            </p>
          </section>

          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
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

          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
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

          <section className="bg-[#0c0d13]/70 backdrop-blur-xl border border-white/[0.07] rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl">
            <h2 className="text-base font-bold font-display text-white mb-3 flex items-center gap-2">
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
      <footer className="border-t border-white/[0.06] py-8 text-xs text-white/30 text-center font-mono safe-bottom">
        NYXWARE PROTOCOL &bull; TERMS OF SERVICE
      </footer>
    </div>
  );
}
