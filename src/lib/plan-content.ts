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

export type LandingPricing =
  | { kind: "plans" }
  | { kind: "fixed"; name: string; price: string; period: string; note?: string }
  | { kind: "form"; variant: "indicate" | "quote"; title: string; description: string };

export type LandingContent = {
  role: ProfileRole;
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  highlights: { title: string; text: string }[];
  steps?: { title: string; text: string }[];
  pricing: LandingPricing;
  faq: { q: string; a: string }[];
  ctaLabel: string;
  secondaryCtaLabel?: string;
};

export const LANDING_CONTENT: Record<ProfileRole, LandingContent> = {
  estudante: {
    role: "estudante",
    path: "/para/estudante",
    eyebrow: "Para estudantes",
    title: "Desenvolva competências e conquiste oportunidades",
    subtitle:
      "Na Upgrade, cada curso gera mais do que um certificado. As competências desenvolvidas alimentam seu perfil e transformam sua trajetória de aprendizagem em inteligência sobre o seu potencial profissional.",
    highlights: [
      {
        title: "Aprendizado que gera valor",
        text: "Aprenda conteúdos que podem ser aplicados na sua formação e carreira.",
      },
      {
        title: "Competências que ganham reconhecimento",
        text: "Transforme seus aprendizados em competências que podem ser identificadas e valorizadas.",
      },
      {
        title: "Uma trajetória que acompanha você",
        text: "Certificados, experiências e competências reunidos para mostrar sua evolução.",
      },
      {
        title: "Oportunidades no momento certo",
        text: "Receba sugestões de vagas compatíveis com sua trajetória e escolha quais oportunidades fazem sentido para você.",
      },
    ],
    pricing: {
      kind: "fixed",
      name: "Plano estudantil",
      price: "R$ 14,90",
      period: "/mês",
      note: "Acesso completo aos cursos, certificados com carga horária e perfil de competências.",
    },
    faq: [
      {
        q: "O que está incluído no plano estudantil?",
        a: "Acesso a todos os cursos publicados, certificados com carga horária e o perfil de competências alimentado automaticamente pelas trilhas concluídas.",
      },
      {
        q: "Preciso estar matriculado em uma instituição?",
        a: "Não. Qualquer estudante pode assinar. Se a sua instituição for parceira, o acesso pode ser liberado pela licença institucional.",
      },
      {
        q: "Os certificados valem como horas complementares?",
        a: "Sim. Cada certificado registra a carga horária do curso e pode ser apresentado à sua instituição.",
      },
      {
        q: "Meus dados vão para empresas?",
        a: "Somente se você ativar o matching e aceitar compartilhar o seu perfil em uma oportunidade específica.",
      },
      {
        q: "Posso cancelar quando quiser?",
        a: "Sim. O cancelamento é feito no painel e o acesso continua até o fim do período já pago.",
      },
    ],
    ctaLabel: "Começar como estudante",
  },
  geral: {
    role: "geral",
    path: "/para/usuario-geral",
    eyebrow: "Para profissionais",
    title: "Sua carreira não precisa parar de evoluir.",
    subtitle:
      "A Upgrade conecta aprendizado, desenvolvimento e oportunidades para quem quer continuar crescendo profissionalmente, com autonomia para aprender no próprio ritmo.",
    highlights: [
      {
        title: "Aprenda no seu ritmo",
        text: "Tenha acesso a cursos e trilhas para continuar desenvolvendo seus conhecimentos e competências.",
      },
      {
        title: "Continue evoluindo",
        text: "Transforme cada novo aprendizado em parte da sua trajetória de desenvolvimento profissional.",
      },
      {
        title: "Dê visibilidade ao que você sabe",
        text: "Reúna suas experiências e competências para apresentar melhor seu potencial profissional.",
      },
      {
        title: "Encontre novas possibilidades",
        text: "Quando houver compatibilidade, receba sugestões de oportunidades e escolha quais fazem sentido para você.",
      },
    ],
    pricing: {
      kind: "fixed",
      name: "Plano profissional",
      price: "R$ 29,90",
      period: "/mês",
      note: "Catálogo completo, certificados verificados e matching opcional de oportunidades.",
    },
    faq: [
      {
        q: "Preciso ter vínculo com faculdade ou empresa?",
        a: "Não. O plano profissional é individual e independe de qualquer vínculo institucional.",
      },
      {
        q: "O que recebo com a assinatura?",
        a: "Acesso a todos os cursos e trilhas, certificados verificados e um perfil de competências sempre atualizado.",
      },
      {
        q: "Como funcionam as sugestões de oportunidades?",
        a: "A plataforma compara suas competências com as necessidades das vagas publicadas e sugere apenas o que for compatível. Você decide se quer avançar.",
      },
      {
        q: "Posso cancelar quando quiser?",
        a: "Sim, a qualquer momento pelo painel, mantendo o acesso até o fim do período pago.",
      },
    ],
    ctaLabel: "Assinar plano profissional",
  },
  colaborador: {
    role: "colaborador",
    path: "/para/colaborador",
    eyebrow: "Para colaboradores",
    title: "Cresça na sua empresa. Desenvolva seu próximo passo.",
    subtitle:
      "Na Upgrade, seu desenvolvimento acompanha seus objetivos profissionais. A partir do cargo que você ocupa e da posição que deseja alcançar, você recebe trilhas direcionadas às competências necessárias para dar o próximo passo.",
    highlights: [
      {
        title: "Desenvolvimento direcionado",
        text: "Aprenda de acordo com as competências que sua função e seus próximos desafios exigem.",
      },
      {
        title: "Evolução profissional",
        text: "Transforme aprendizado em novas capacidades para avançar na carreira.",
      },
      {
        title: "Mobilidade interna",
        text: "Esteja preparado para novas funções e oportunidades dentro da empresa.",
      },
      {
        title: "Reconhecimento do seu potencial",
        text: "Torne sua evolução mais visível e mostre que está preparado para novos desafios.",
      },
    ],
    pricing: {
      kind: "form",
      variant: "indicate",
      title: "Indique sua empresa",
      description:
        "O acesso do colaborador é liberado pela licença da empresa. Indique sua empresa e nosso time entra em contato com o RH.",
    },
    faq: [
      {
        q: "Eu pago alguma coisa?",
        a: "Não. O acesso do colaborador é contratado pela empresa por meio de licenças.",
      },
      {
        q: "Minha empresa ainda não usa a Upgrade. O que faço?",
        a: "Preencha o formulário de indicação nesta página. Nosso time entra em contato com a área responsável.",
      },
      {
        q: "Minha empresa vê tudo o que eu faço?",
        a: "A empresa acompanha o progresso ligado ao plano de desenvolvimento, de forma agregada e sem dados sensíveis.",
      },
      {
        q: "Recebo vagas de outras empresas?",
        a: "Não. O perfil colaborador não participa do matching externo.",
      },
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
    pricing: { kind: "plans" },
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
    pricing: { kind: "plans" },
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
    title: "Desenvolva pessoas. Encontre talentos. Cresça melhor.",
    subtitle:
      "Na Upgrade, sua empresa conecta desenvolvimento, competências e oportunidades. Desenvolva seus colaboradores de acordo com as necessidades do negócio, reduza gaps de competências e encontre profissionais mais alinhados às suas oportunidades.",
    highlights: [
      {
        title: "Contratação mais assertiva",
        text: "Encontre profissionais a partir das competências desenvolvidas e da compatibilidade com as necessidades da vaga.",
      },
      {
        title: "Desenvolvimento sob medida",
        text: "Crie trilhas de desenvolvimento alinhadas aos cargos, às necessidades do negócio e aos próximos passos dos colaboradores.",
      },
      {
        title: "Mais retenção e mobilidade",
        text: "Desenvolva seus talentos internamente e crie caminhos de crescimento que ajudam a reduzir turnover.",
      },
      {
        title: "Inteligência sobre competências",
        text: "Entenda quais competências sua empresa já possui e onde estão os principais gaps de desenvolvimento.",
      },
    ],
    pricing: {
      kind: "form",
      variant: "quote",
      title: "Peça um orçamento",
      description:
        "Cada empresa tem uma necessidade diferente. Conte um pouco sobre o seu time e montamos uma proposta sob medida.",
    },
    faq: [
      {
        q: "Como a Upgrade ajuda minha empresa?",
        a: "A Upgrade conecta desenvolvimento de pessoas, competências e oportunidades para apoiar decisões de contratação, desenvolvimento e mobilidade interna.",
      },
      {
        q: "A Upgrade substitui o processo de seleção da empresa?",
        a: "Não. A Upgrade identifica e sugere profissionais com maior compatibilidade, mas a decisão de avançar, entrevistar e contratar permanece sempre com a empresa.",
      },
      {
        q: "Como funciona o matching de profissionais?",
        a: "A empresa informa as competências necessárias para uma oportunidade e a plataforma identifica profissionais com maior compatibilidade, considerando as competências desenvolvidas e as informações que eles autorizaram compartilhar.",
      },
      {
        q: "Posso usar a Upgrade para desenvolver meus colaboradores?",
        a: "Sim. A empresa pode direcionar trilhas de desenvolvimento de acordo com o cargo atual e com as posições que o colaborador deseja alcançar.",
      },
      {
        q: "A Upgrade ajuda a reduzir turnover?",
        a: "A plataforma pode apoiar estratégias de desenvolvimento e mobilidade interna, ajudando a criar caminhos de crescimento para os colaboradores e a aproveitar melhor os talentos que a empresa já possui.",
      },
      {
        q: "A empresa pode procurar profissionais diretamente?",
        a: "Sim. A proposta da Upgrade pode permitir que empresas encontrem profissionais e especialistas de acordo com suas necessidades, incluindo possibilidades como contratação, palestras e outras demandas profissionais.",
      },
    ],
    ctaLabel: "Quero conhecer a Upgrade",
    secondaryCtaLabel: "Indicar minha empresa",
  },
};
