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
};

export const PROFILES: ProfileDefinition[] = [
  {
    role: "estudante",
    label: "Estudante",
    icon: GraduationCap,
    tagline: "Aprende e constrói competências verificadas.",
    bullets: [
      "Aprende",
      "Constrói competências",
      "Recebe certificados",
      "Pode receber sugestões de vagas",
    ],
  },
  {
    role: "geral",
    label: "Usuário Geral",
    icon: UserRound,
    tagline: "Mesma jornada do estudante, sem vínculo institucional.",
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
    bullets: ["Publica cursos", "Acompanha audiência", "Visualiza score", "Recebe remuneração"],
  },
  {
    role: "ies",
    label: "IES",
    icon: Landmark,
    tagline: "Indicadores agregados e relatórios regulatórios.",
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