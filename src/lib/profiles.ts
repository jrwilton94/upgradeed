import {
  Building2,
  GraduationCap,
  Landmark,
  Presentation,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProfileRole = "estudante" | "geral" | "colaborador" | "professor" | "ies" | "empresa";

export type ProfileDefinition = {
  role: ProfileRole;
  label: string;
  icon: LucideIcon;
  tagline: string;
  bullets: string[];
  emoji: string;
  summary: string;
  path:
    | "/para/estudante"
    | "/para/usuario-geral"
    | "/para/colaborador"
    | "/para/professor"
    | "/para/ies"
    | "/para/empresa";
};

export const PROFILES: ProfileDefinition[] = [
  {
    role: "estudante",
    label: "Estudante",
    icon: GraduationCap,
    tagline: "Aprende e constrói competências verificadas.",
    emoji: "👨‍🎓",
    summary: "Construa competências e conquiste oportunidades.",
    path: "/para/estudante",
    bullets: [
      "Aprende",
      "Constrói competências",
      "Recebe certificados",
      "Pode receber sugestões de vagas",
    ],
  },
  {
    role: "geral",
    label: "Profissional",
    icon: UserRound,
    tagline: "Mesma jornada do estudante, sem vínculo institucional.",
    emoji: "👤",
    summary: "Aprenda continuamente e evolua profissionalmente.",
    path: "/para/usuario-geral",
    bullets: [
      "Mesmo funcionamento do estudante",
      "Plano pago",
      "Sem vínculo com instituição",
    ],
  },
  {
    role: "colaborador",
    label: "Colaborador",
    icon: Users,
    tagline: "Desenvolvimento e mobilidade interna na empresa.",
    emoji: "🏢",
    summary: "Desenvolva novas competências e avance na sua carreira.",
    path: "/para/colaborador",
    bullets: [
      "Funcionário de empresa",
      "Possui plano de desenvolvimento",
      "Recebe trilhas para crescimento interno",
      "Não participa do matching externo",
    ],
  },
  {
    role: "professor",
    label: "Professor",
    icon: Presentation,
    tagline: "Publica cursos e acompanha audiência e receita.",
    emoji: "👨‍🏫",
    summary: "Compartilhe conhecimento e transforme carreiras.",
    path: "/para/professor",
    bullets: ["Publica cursos", "Acompanha audiência", "Visualiza score", "Recebe remuneração"],
  },
  {
    role: "ies",
    label: "IES",
    icon: Landmark,
    tagline: "Indicadores agregados e relatórios regulatórios.",
    emoji: "🏫",
    summary: "Transforme dados em melhores decisões acadêmicas.",
    path: "/para/ies",
    bullets: [
      "Publica conteúdos",
      "Visualiza indicadores agregados",
      "Empregabilidade",
      "Relatórios para MEC",
      "Não visualiza dados individuais",
    ],
  },
  {
    role: "empresa",
    label: "Empresa",
    icon: Building2,
    tagline: "Publica vagas e recebe candidatos compatíveis.",
    emoji: "🏢",
    summary: "Transforme competências em produtividade e retenção de talentos.",
    path: "/para/empresa",
    bullets: [
      "Publica vagas",
      "Gerencia colaboradores",
      "Recebe candidatos compatíveis",
      "Acompanha indicadores",
    ],
  },
];

export function profileByRole(role?: ProfileRole | null) {
  return PROFILES.find((p) => p.role === role);
}