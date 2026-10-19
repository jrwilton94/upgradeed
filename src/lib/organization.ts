export type OrganizationType = "empresa" | "ies";
export const ORGANIZATION_PERMISSIONS = {
  empresa: [
    ["colaboradores", "Gerenciar colaboradores"], ["competencias", "Ver perfis de competência"],
    ["cargos", "Gerenciar cargos e trilhas"], ["vagas_internas", "Criar vagas internas"],
    ["vagas_externas", "Criar vagas externas"], ["candidatos", "Avaliar candidatos"],
    ["relatorios", "Ver relatórios"], ["faturamento", "Gerenciar licenças e faturamento"],
    ["subperfis", "Gerenciar subperfis"],
  ],
  ies: [
    ["conteudo", "Publicar conteúdo"], ["professores", "Gerenciar professores vinculados"],
    ["relatorios", "Ver relatórios agregados"], ["cursos", "Gerenciar cursos e turmas"],
    ["validar_vinculos", "Validar vínculos de alunos"], ["bancarios", "Gerenciar dados bancários"],
    ["subperfis", "Gerenciar subperfis"],
  ],
} as const;
export type OrganizationAccess = { owner: boolean; permissions: string[]; scope_ids: string[] };
export function hasPermission(access: OrganizationAccess | null | undefined, permission: string) {
  return Boolean(access?.owner || access?.permissions.includes(permission));
}