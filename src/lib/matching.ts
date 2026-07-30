export type MatchInput = {
  completedSkills: string[];
  interests: string[];
  studyHours: number;
  certificates: number;
  behavioralDone: boolean;
  preferences: {
    area?: string | null;
    city?: string | null;
    state?: string | null;
    work_model?: string | null;
    contract_type?: string | null;
  } | null;
};

export type JobLike = {
  id: string;
  title: string;
  area: string;
  required_skills: string[];
  desired_skills: string[];
  modality: string;
  city: string | null;
  state: string | null;
  contract_type: string;
  seniority: string;
};

export type MatchResult = {
  score: number;
  matchedSkills: string[];
  reasons: string[];
};

const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();

/**
 * Motor de matching — sugestão informacional apenas.
 * Nunca elimina candidatos, nunca decide contratação, nunca usa dados sensíveis.
 */
export function computeMatch(job: JobLike, input: MatchInput): MatchResult {
  const reasons: string[] = [];
  const owned = new Set(input.completedSkills.map(norm));

  const required = job.required_skills ?? [];
  const desired = job.desired_skills ?? [];
  const matchedRequired = required.filter((s) => owned.has(norm(s)));
  const matchedDesired = desired.filter((s) => owned.has(norm(s)));

  // Competências obrigatórias — 45 pontos
  const requiredScore = required.length ? (matchedRequired.length / required.length) * 45 : 25;
  // Competências desejáveis — 15 pontos
  const desiredScore = desired.length ? (matchedDesired.length / desired.length) * 15 : 8;

  matchedRequired.forEach((s) => reasons.push(`Você possui a competência ${s}`));
  matchedDesired.forEach((s) => reasons.push(`Competência desejável ${s} desenvolvida na plataforma`));

  const prefs = input.preferences;
  let prefScore = 0;
  if (prefs?.area && norm(prefs.area) === norm(job.area)) {
    prefScore += 12;
    reasons.push(`Você selecionou interesse na área de ${job.area}`);
  }
  if (prefs?.work_model && norm(prefs.work_model) === norm(job.modality)) {
    prefScore += 8;
    reasons.push(`Modalidade ${job.modality} compatível com sua preferência`);
  }
  if (prefs?.contract_type && norm(prefs.contract_type) === norm(job.contract_type)) {
    prefScore += 6;
    reasons.push(`Tipo de contrato ${job.contract_type} compatível com sua preferência`);
  }
  if (prefs?.city && norm(prefs.city) === norm(job.city)) {
    prefScore += 6;
    reasons.push(`Cidade declarada por você (${job.city}) é a mesma da vaga`);
  } else if (norm(job.modality) === "remoto") {
    prefScore += 4;
    reasons.push("Vaga remota, sem restrição de cidade");
  }

  // Tempo de estudo — até 8 pontos
  const studyScore = Math.min(input.studyHours / 40, 1) * 8;
  if (input.studyHours > 0) {
    reasons.push(`${Math.round(input.studyHours)}h de estudo concluídas na plataforma`);
  }
  // Certificados — até 6 pontos
  const certScore = Math.min(input.certificates / 3, 1) * 6;
  if (input.certificates > 0) reasons.push(`${input.certificates} certificado(s) emitido(s)`);
  // Teste comportamental — 4 pontos
  const behaviorScore = input.behavioralDone ? 4 : 0;
  if (input.behavioralDone) reasons.push("Teste comportamental concluído");

  const raw = requiredScore + desiredScore + prefScore + studyScore + certScore + behaviorScore;
  const score = Math.max(0, Math.min(99, Math.round(raw)));

  return {
    score,
    matchedSkills: [...matchedRequired, ...matchedDesired],
    reasons: reasons.slice(0, 6),
  };
}