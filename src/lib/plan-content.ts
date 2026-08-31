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
  | { kind: "statement"; title: string; description: string }
  | {
      kind: "form";
      variant: "indicate" | "quote" | "join";
      title: string;
      description: string;
    };

export type LandingContent = {
  role: ProfileRole;
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  highlights: { title: string; text: string }[];
  steps?: { title: string; text: string }[];
  opportunities?: { title: string; text: string };
  revenue?: {
    title: string;
    description: string;
    rows: { label: string; detail: string }[];
    note?: string;
    ctaLabel?: string;
  };
  contactForm?: { title: string; description: string };
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
    title: "Transforme seu conhecimento em oportunidades",
    subtitle:
      "Na Upgrade, você compartilha conhecimento, alcança novos públicos e transforma sua experiência em cursos, conteúdos e novas possibilidades de atuação profissional.",
    highlights: [
      {
        title: "Compartilhe seu conhecimento",
        text: "Transforme sua experiência em cursos e conteúdos que ajudam pessoas a desenvolver novas competências.",
      },
      {
        title: "Alcance novos públicos",
        text: "Leve seu conteúdo para uma audiência interessada em aprender, se desenvolver e avançar profissionalmente.",
      },
      {
        title: "Acompanhe seu desempenho",
        text: "Tenha visibilidade sobre o alcance, consumo e conclusão dos seus conteúdos.",
      },
      {
        title: "Gere novas receitas",
        text: "Receba remuneração de acordo com o desempenho e a receita gerada pelos seus conteúdos.",
      },
    ],
    pricing: {
      kind: "form",
      variant: "join",
      title: "Junte-se a nós",
      description:
        "Conte um pouco sobre a sua área de atuação e experiência. Nosso time entra em contato para apresentar os próximos passos.",
    },
    opportunities: {
      title: "Amplie suas oportunidades",
      text: "Divulgue seus cursos, aulas particulares, palestras e outros serviços para uma audiência interessada no seu conhecimento.",
    },
    revenue: {
      title: "Conheça nosso modelo de remuneração",
      description:
        "A remuneração acompanha o desempenho dos seus conteúdos na plataforma. Veja como funciona em linhas gerais:",
      rows: [
        { label: "Audiência", detail: "Quanto mais pessoas assistem e concluem seus conteúdos, maior o seu repasse." },
        { label: "Receita atribuída", detail: "Parte da receita da plataforma é distribuída conforme o consumo de cada conteúdo." },
        { label: "Qualidade", detail: "Avaliações e taxa de conclusão influenciam positivamente o resultado." },
        { label: "Serviços extras", detail: "Aulas particulares, palestras e mentorias divulgadas na Upgrade são negociadas diretamente com você." },
      ],
      note: "Os detalhes completos são apresentados no contrato de parceria.",
      ctaLabel: "Saiba mais",
    },
    faq: [
      {
        q: "Preciso pagar para publicar meus conteúdos?",
        a: "Não. A publicação não tem mensalidade: sua remuneração acompanha o desempenho dos conteúdos.",
      },
      {
        q: "Como funciona a remuneração?",
        a: "O repasse é calculado a partir da audiência, do consumo e da receita atribuída aos seus conteúdos, com acompanhamento pelo painel.",
      },
      {
        q: "Como faço para me tornar professor parceiro?",
        a: "Preencha o formulário desta página. Nosso time avalia sua área de atuação e apresenta os próximos passos.",
      },
      {
        q: "Preciso de estúdio ou equipamento profissional?",
        a: "Não. Enviamos o roteiro pedagógico e o padrão mínimo de qualidade de áudio e vídeo.",
      },
      {
        q: "Posso divulgar outros serviços além dos cursos?",
        a: "Sim. Você pode divulgar aulas particulares, palestras e outros serviços para uma audiência interessada no seu conhecimento.",
      },
    ],
    ctaLabel: "Quero ser professor parceiro",
  },
  ies: {
    role: "ies",
    path: "/para/ies",
    eyebrow: "Para instituições de ensino",
    title: "Transforme a trajetória dos alunos em inteligência para sua IES",
    subtitle:
      "Na Upgrade, sua instituição acompanha o desenvolvimento de competências ao longo da jornada acadêmica e transforma esses dados em indicadores de empregabilidade, desenvolvimento e conexão com o mercado.",
    highlights: [
      {
        title: "Acompanhe o desenvolvimento",
        text: "Entenda quais competências estão sendo desenvolvidas pelos alunos ao longo da jornada acadêmica.",
      },
      {
        title: "Gere inteligência acadêmica",
        text: "Transforme dados agregados de aprendizagem e competências em indicadores para apoiar decisões da instituição.",
      },
      {
        title: "Fortaleça a empregabilidade",
        text: "Aproxime a formação acadêmica das competências valorizadas pelo mercado e amplie as possibilidades profissionais dos alunos.",
      },
      {
        title: "Comprove resultados",
        text: "Tenha indicadores e relatórios que ajudam sua IES a demonstrar resultados de desenvolvimento e empregabilidade.",
      },
    ],
    pricing: {
      kind: "statement",
      title: "Seja parceira da Upgrade e transforme a jornada dos seus alunos",
      description:
        "Ao oferecer a Upgrade aos seus alunos, sua IES amplia as oportunidades de desenvolvimento e empregabilidade e passa a contar com inteligência sobre competências, indicadores e evolução acadêmica, sem custo adicional para a instituição.",
    },
    contactForm: {
      title: "Solicite mais informações",
      description:
        "Preencha o formulário e nosso time institucional entra em contato para apresentar a parceria.",
    },
    faq: [
      {
        q: "A IES paga para oferecer a Upgrade aos alunos?",
        a: "Não há custo adicional para a instituição parceira. Os detalhes da parceria são apresentados no contato com nosso time.",
      },
      {
        q: "Quais dados a instituição visualiza?",
        a: "Apenas indicadores agregados de desenvolvimento, competências e empregabilidade. Dados individuais dos alunos não são expostos.",
      },
      {
        q: "Como os dados ajudam nas decisões acadêmicas?",
        a: "Os indicadores mostram quais competências estão sendo desenvolvidas e como se relacionam às exigências do mercado, apoiando ajustes de currículo e ações de empregabilidade.",
      },
      {
        q: "Os certificados contam como horas complementares?",
        a: "Sim. Cada certificado registra a carga horária concluída e pode ser aproveitado conforme as regras da instituição.",
      },
      {
        q: "Como iniciamos a parceria?",
        a: "Preencha o formulário desta página. Nosso time apresenta o modelo de parceria e organiza a liberação de acesso aos alunos.",
      },
    ],
    ctaLabel: "Falar com nosso time",
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
