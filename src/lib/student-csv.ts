/** Leitura simples de CSV (vírgula ou ponto e vírgula, aspas duplas). Cabeçalhos: email, nome, nivel, curso, semestre, matricula, serie, turma, validade. */
export const STUDENT_CSV_HEADERS = [
  "email",
  "nome",
  "nivel",
  "curso",
  "semestre",
  "matricula",
  "serie",
  "turma",
  "validade",
] as const;
export const STUDENT_CSV_TEMPLATE =
  "email;nome;nivel;curso;semestre;matricula;serie;turma;validade\r\n" +
  "aluno@exemplo.com;Nome do Aluno;graduacao;Administração;3;2024001;;;2026-12-31\r\n" +
  "aluna@exemplo.com;Nome da Aluna;medio;;;;2º ano;A;2026-12-31\r\n";

export type StudentCsvRow = Record<(typeof STUDENT_CSV_HEADERS)[number], string> & { line: number };

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseStudentCsv(text: string): { rows: StudentCsvRow[]; error?: string } {
  const lines = text
    .replace(new RegExp("^\\uFEFF"), "")
    .split(/\r?\n/)
    .map((l, i) => ({ l, line: i + 1 }))
    .filter((x) => x.l.trim() !== "");
  if (lines.length < 2)
    return { rows: [], error: "A planilha precisa de cabeçalho e ao menos uma linha." };
  const sep =
    (lines[0].l.match(/;/g)?.length ?? 0) >= (lines[0].l.match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = splitLine(lines[0].l, sep).map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
  );
  const missing = ["email", "nome", "nivel", "validade"].filter((h) => !header.includes(h));
  if (missing.length)
    return { rows: [], error: `Colunas obrigatórias ausentes: ${missing.join(", ")}.` };
  const rows = lines.slice(1).map(({ l, line }) => {
    const cells = splitLine(l, sep);
    const row = { line } as StudentCsvRow;
    for (const key of STUDENT_CSV_HEADERS) {
      const idx = header.indexOf(key);
      row[key] = idx >= 0 ? (cells[idx] ?? "") : "";
    }
    return row;
  });
  return { rows };
}
