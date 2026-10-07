import type { ProfileRole } from "@/lib/profiles";
import { PROFILE_FAQ } from "@/lib/profile-faq";

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
      note: "Exige matrícula regular em instituição de ensino. Cursos, certificados com carga horária e perfil de competências.",
    },
    faq: PROFILE_FAQ.estudante,
    ctaLabel: "Começar como estudante",
  },
  geral: {
    role: "geral",
    path: "/para/profissional",
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
    faq: PROFILE_FAQ.geral,
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
    faq: PROFILE_FAQ.colaborador,
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
        text: "Participe do fundo de professores, formado por 25% da receita mensal, conforme seu score.",
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
        { label: "Fundo de professores", detail: "25% da receita mensal da plataforma, separado do fundo das IES." },
        { label: "Audiência", detail: "Participação dos minutos assistidos: 50% do score no MVP, 55% na tração e 60% na escala." },
        { label: "Produção", detail: "Participação dos minutos de conteúdo aprovado: 40% no MVP, 25% na tração e 20% na escala." },
        { label: "Conclusão", detail: "Taxa média de conclusão: 10% no MVP e 20% na tração e escala." },
        { label: "Remuneração", detail: "Seu score multiplicado pelo fundo mensal dos professores. Score e fundo são acompanhados semanalmente." },
      ],
      note: "Audiência conta a partir de 20 segundos, limitada à duração do vídeo por pessoa/dia. Conteúdos sem visualização no mês não diluem o fundo.",
      ctaLabel: "Saiba mais",
    },
    faq: PROFILE_FAQ.professor,
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
        title: "Publique e seja remunerada",
        text: "Publique aulas sem oferecer diploma e participe do fundo exclusivo das IES: 10% da receita mensal, distribuído por score entre instituições com conteúdo ativo.",
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
    faq: PROFILE_FAQ.ies,
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
    faq: PROFILE_FAQ.empresa,
    ctaLabel: "Quero conhecer a Upgrade",
    secondaryCtaLabel: "Indicar minha empresa",
  },
};
