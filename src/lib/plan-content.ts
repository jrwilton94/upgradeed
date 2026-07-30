import type { ProfileRole } from "@/lib/profiles";

export type PlanRow = {
  id: string;
  code: string;
  name: string;
  audience: ProfileRole;
  description: string;
  price_month_cents: number;
  price_year_cents: number;
  unit: string;
  features: string[];
  highlight: boolean;
  position: number;
};

export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export type LandingContent = {
  role: ProfileRole;
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  highlights: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  ctaLabel: string;
};

export const LANDING_CONTENT: Record<ProfileRole, LandingContent> = {
  estudante: {
    role: "estudante",
    path: "/para/estudante",
    eyebrow: "Para estudantes",
    title: "Aprendizado que vira oportunidade real",
    subtitle:
      "Estude cursos curtos, gere certificados com carga horária e construa um perfil de competências verificadas que pode ser sugerido para vagas — só se você quiser.",
    highlights: [
      { title: "Certificados válidos", text: "Carga horária automática para horas complementares." },
      { title: "Perfil de competências", text: "Cada curso concluído gera skills verificadas." },
      { title: "Matching opcional", text: "Você decide se quer receber sugestões de vagas." },
    ],
    steps: [
      { title: "Crie sua conta", text: "Cadastre-se gratuitamente com e-mail ou Google." },
      { title: "Escolha o perfil Estudante", text: "No onboarding, informe sua instituição se houver convênio." },
      { title: "Ative seu plano", text: "Se sua instituição é parceira, o acesso é liberado sem custo. Caso contrário, assine o Estudante Plus no painel." },
    ],
    faq: [
      { q: "Minha instituição precisa ser parceira?", a: "Não. Sem convênio você pode assinar o plano Estudante Plus individualmente." },
      { q: "Meus dados vão para empresas?", a: "Somente se você ativar o matching e aceitar compartilhar o perfil em uma vaga específica." },
    ],
    ctaLabel: "Começar como estudante",
  },
  geral: {
    role: "geral",
    path: "/para/usuario-geral",
    eyebrow: "Para você",
    title: "Requalificação profissional sem vínculo institucional",
    subtitle:
      "Mesma jornada do estudante, sem depender de faculdade ou empresa. Assine, estude no seu ritmo e apareça para quem contrata.",
    highlights: [
      { title: "Catálogo completo", text: "Acesso a todas as trilhas e cursos publicados." },
      { title: "Assinatura flexível", text: "Mensal ou anual, cancele quando quiser." },
      { title: "Empregabilidade", text: "Matching por competências verificadas, não por currículo." },
    ],
    steps: [
      { title: "Crie sua conta", text: "Cadastro em menos de um minuto." },
      { title: "Escolha o perfil Usuário Geral", text: "Sem código de empresa ou instituição." },
      { title: "Assine o plano", text: "Pagamento por Pix, boleto ou cartão direto no painel." },
    ],
    faq: [
      { q: "Posso cancelar?", a: "Sim, a qualquer momento. O acesso segue até o fim do período pago." },
      { q: "Tem período de teste?", a: "Sim, os primeiros 7 dias são liberados como trial." },
    ],
    ctaLabel: "Assinar plano individual",
  },
  colaborador: {
    role: "colaborador",
    path: "/para/colaborador",
    eyebrow: "Para colaboradores",
    title: "Cresça dentro da empresa onde você já está",
    subtitle:
      "Trilhas de desenvolvimento definidas junto com o RH, foco em mobilidade interna e zero exposição do seu perfil para o mercado externo.",
    highlights: [
      { title: "Licença da empresa", text: "Sem custo para você: a empresa contrata as licenças." },
      { title: "Plano de desenvolvimento", text: "Trilhas alinhadas ao seu cargo e ao próximo passo." },
      { title: "Privacidade", text: "Colaboradores não participam do matching externo." },
    ],
    steps: [
      { title: "Peça o código ao RH", text: "Cada empresa parceira tem um código de vínculo." },
      { title: "Crie sua conta", text: "Escolha o perfil Colaborador no onboarding." },
      { title: "Informe o código", text: "Seu acesso é liberado imediatamente pela licença da empresa." },
    ],
    faq: [
      { q: "Minha empresa vê meu progresso?", a: "Sim, de forma agregada e ligada ao plano de desenvolvimento — nunca dados sensíveis." },
      { q: "Recebo vagas externas?", a: "Não. O perfil colaborador não entra no matching de vagas externas." },
    ],
    ctaLabel: "Entrar com código da empresa",
  },
  professor: {
    role: "professor",
    path: "/para/professor",
    eyebrow: "Para professores",
    title: "Publique cursos e seja remunerado por audiência",
    subtitle:
      "Sem mensalidade. Você publica trilhas curtas seguindo o roteiro pedagógico da Upgrade e recebe repasse conforme minutos assistidos e conclusões.",
    highlights: [
      { title: "Sem mensalidade", text: "Você não paga para publicar: ganha por performance." },
      { title: "Painel de audiência", text: "Alunos alcançados, minutos assistidos, avaliação e conclusão." },
      { title: "Repasse transparente", text: "60% da receita atribuída aos seus cursos." },
    ],
    steps: [
      { title: "Cadastre-se", text: "Crie a conta e escolha o perfil Professor." },
      { title: "Passe pela curadoria", text: "A gestão da Upgrade valida seu cadastro e área de atuação." },
      { title: "Publique e receba", text: "Siga o roteiro (aula de ~60min, jogo de fixação e avaliação) e acompanhe o repasse mensal." },
    ],
    faq: [
      { q: "Como recebo?", a: "Repasse mensal calculado sobre a receita atribuída aos seus cursos e registrado no seu painel." },
      { q: "Preciso de estúdio?", a: "Não. Enviamos o roteiro e o padrão mínimo de qualidade de áudio e vídeo." },
    ],
    ctaLabel: "Quero publicar cursos",
  },
  ies: {
    role: "ies",
    path: "/para/ies",
    eyebrow: "Para instituições de ensino",
    title: "Empregabilidade mensurável para sua IES",
    subtitle:
      "Horas complementares automáticas, indicadores agregados de competências e relatórios prontos para avaliação regulatória — sem acessar dados individuais dos alunos.",
    highlights: [
      { title: "Relatórios regulatórios", text: "Dados consolidados para processos de avaliação." },
      { title: "Horas complementares", text: "Certificados com carga horária lançados automaticamente." },
      { title: "Privacidade por padrão", text: "A IES enxerga indicadores agregados, nunca dados individuais." },
    ],
    steps: [
      { title: "Fale com a gestão", text: "Escolha o plano e solicite o contrato institucional." },
      { title: "Cadastro da IES", text: "A gestão da Upgrade cadastra a instituição e cria o código de vínculo." },
      { title: "Convide os alunos", text: "Os alunos entram com o código e o acesso é liberado pela licença institucional." },
    ],
    faq: [
      { q: "Como é a cobrança?", a: "Contrato mensal ou anual por instituição, com faturamento centralizado." },
      { q: "A IES vê notas individuais?", a: "Não. O painel institucional apresenta apenas indicadores agregados." },
    ],
    ctaLabel: "Falar com a gestão",
  },
  empresa: {
    role: "empresa",
    path: "/para/empresa",
    eyebrow: "Para empresas",
    title: "Contrate por competências verificadas",
    subtitle:
      "Publique vagas, receba candidatos compatíveis que autorizaram o compartilhamento do perfil e desenvolva seus colaboradores na mesma plataforma.",
    highlights: [
      { title: "Matching explicável", text: "Cada score mostra as competências que geraram a compatibilidade." },
      { title: "Desenvolvimento interno", text: "Licenças de colaborador incluídas para mobilidade interna." },
      { title: "Consentimento explícito", text: "Você só vê o perfil de quem aceitou compartilhar." },
    ],
    steps: [
      { title: "Escolha o plano", text: "Starter ou Scale, conforme o número de colaboradores." },
      { title: "Cadastro da empresa", text: "Crie a conta empresa ou solicite o cadastro à gestão da Upgrade." },
      { title: "Publique vagas", text: "Receba candidatos compatíveis e distribua licenças ao time." },
    ],
    faq: [
      { q: "Como é cobrado?", a: "Mensal ou anual por faixa de colaboradores, com nota fiscal emitida pela Upgrade." },
      { q: "A IA descarta candidatos?", a: "Nunca. A IA é assistiva: ela ordena sugestões e explica o motivo, a decisão é humana." },
    ],
    ctaLabel: "Contratar plano empresarial",
  },
};
